const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const user = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const {promisify} = require('util');
const Email = require('./../utils/email');
const { log } = require('console');
const { url } = require('inspector');

//function for creating token
const signToken = (id) =>{
 return jwt.sign({id},  process.env.JWT_SECRET,  {expiresIn:process.env.JWT_EXPIRES_IN });
}



const createSendToken = catchAsync(async(User,statusCode,res) =>{
   const token = signToken(User._id);
   const cookieOption = 
   {    
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000 ),   //converting to millisecond
      secure : true,                                      //  cookie will be only on an encrypted connection(https)
      httpOnly : true                                     //this ensures that cookie can't be accessed r modified in any by the browser
   };
   if(process.env.NODE_ENV === 'production') cookieOption.secure = true;
   
   res.cookie('jwt',token,cookieOption)                  //res.cookie(name,value,[options])


  User.password = undefined;  //Removes password from the output

     res.status(statusCode)
      .json({
      status:'success',
      token,
      data:{
      User
      }
     });
});


exports.signup = catchAsync(async (req, res, next) => {
const newUser = await user.create(req.body); 
const url  = `${req.protocol}://${req.get('host')}/me`;
await new Email(newUser, url).sendWelcome()
//for user verification we use jsonwebtoken
// const token = jwt.sign({id:newUser._id},  process.env.JWT_SECRET,  {expiresIn:process.env.JWT_EXPIRES_IN }) ;

createSendToken(newUser,201,res);

});

exports.login = catchAsync(async (req,res,next) => {
    const {email,password} = req.body;
      //1) check if email or password exists
      if(!email || !password)
      {
       return next(new appError('Please provide email and password',400));
      }
      //2)check if user exits and password is correct
      
      const User = await user.findOne({ email}).select("+password");
  

      if( !User  || !(await User.correctPassword(password,User.password)))
      {
         return next(new appError('Incorrect email or password',401));
      }

      //3)If everything is ok, then send token to the client
      createSendToken(User,200,res);
});

   

exports.logout = (req,res) =>{
   res.cookie('jwt','loggedout',{

      expires: new Date(Date.now() + 10*1000),     //this cookie expires in 10s after forming
      httpOnly:true
   })
   res.status(200).json({status:'success'})
}



     
 //Authentication
exports.protect = catchAsync(async (req,res,next)=>{    //This function proctects the route which can only be accessed by logged in users
//1) Getting token and check it's there
let token;
if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
{
    token = req.headers.authorization.split(' ')[1]; 
}
else if(req.cookies.jwt) {
   token = req.cookies.jwt;
}

if(!token )
{
   return next(new appError('You are not logged in!',401));
}

//2)verification of token
const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)  //promisify makes this async funtion which returns promise
//console.log(decoded);


//3check if the user still exits
const currentUser = await user.findById(decoded.id)
if(!currentUser) {
   return next(new appError('The user belonging to this token does no longer exist. ',401));
}


//4) check if user changed password after token was issued
if(currentUser.changedPassword(decoded.iat)){
   return next(new appError('User changed password after token was issued!. Please login again',401));
}


//grants access to next protected route-------(user.id is acced from here when protect() is used)
req.user = currentUser;
res.locals.user = currentUser;    // heres user variable which can be accessed by the pug templates
next();

});       


//Only for rendered pages so no errors  

exports.isLoggedIn = async (req,res,next)=>{     
  //1 )verification of token
   if(req.cookies.jwt) 
   {      
    try{
      
         const decoded = await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET)   
         //2)check if the user still exits
         const currentUser = await user.findById(decoded.id)

         if(!currentUser) {
            return next();
         }
         
         //3) check if user changed password after token was issued
         if(currentUser.changedPassword(decoded.iat)){
            return next();
         }

         //If reached here then there is a loggedin user

         res.locals.user = currentUser;    // heres user variable which can be accessed by the pug templates
        
         return next();
     }catch(err){
    
         return next(); 
      } 
   }
     next();
};       





//Authorization
exports.restrictTo = (...roles) => {  //As middleware does'nt accept arguments so this function creates an array of arguments passes Eg.(roles['admin',lead-guide]) and as return middleware funtion is called
 return (req,res,next) =>{             //This function allows only certain users to access the route  Eg.Only admin can delete a tour and not all users
   
 //roles  =['admin','lead-guide'] ......This is a parameter
 //req.user.role = This is the actual role of the user trying to access this route
   if(!roles.includes(req.user.role))
   {
    return next(new appError('You do not have permission to perform this action',403));
   }
  next();
 };
}; 

exports.forgotPassword =catchAsync(async (req,res,next)=>{
   //1) Get user based on Posted e-mail
   const User = await user.findOne({email:req.body.email});
   if(!User)
   {
      return next(new appError('There is no user with this email address.',404));
   }
   //2) Generate the random reset token
   const resetToken = User.createPasswordResetToken();
   await User.save({validateBeforeSave:false});

   //3)Send the generated reset token to user's email address
   
   
   try {

      const resetURL = req.protocol+'://'+req.get('host')+'/api/v1/users/resetPassword/'+resetToken;
      await new Email(User,resetURL).sendPasswordReset()

      res.status(200)
         .json({
         staus:'Success',
         message:'Token sent to the email!'
        })
 }catch {
   User.passwordResetToken = undefined;
   User.passwordResetExpires = undefined;
   await User.save({validateBeforeSave:false});

      return next(new appError('There was an error while sending the email!, Please try again later.',500));
 }
  
});  
  

  exports.resetPassword = catchAsync(async (req,res,next)=>{
   //1) Get user based on token
      const hashedToken = crypto        // here we convert token to encrypted form to compare with the same token in database
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

      const User = await user.findOne({passwordResetToken:hashedToken,passwodResetExpires : { $gt: Date.now() }  // This only returns when passwordResetExpires > currentDate
   });


   //2)If token has not expired,and there is user,set the new password 
   if(!User)
   {
      return next(new appError('Token invalid or has expired',400));
   } 
   User.passwordResetExpires = undefined; // No need for this
   User.passwordResetToken = undefined; // No need for this

   User.password = req.body.password      //new password is updated
   User.passwordConfirm = req.body.passwordConfirm
   await User.save();                     //here we use save() to let validators work and not update like in tours as passwords are encrypted

   //3) Update changedPassword at property for the user
                    
                //This is done in userModel as middleware function            

   //4) Log the user in,send Jwt
   createSendToken(User,200,res);

    
});

exports.updatePassword = catchAsync(async (req,res,next) =>{
   //1)Get user from collection
   const User = await user.findById(req.user.id).select('+password');       //Here req.user.id comes from authorization in postman where bearer token is recieved


   //2)Check if posted password is correct
      if( !(await User.correctPassword(req.body.passwordCurrent,User.password)))
      {
         return next(new appError('Invalid current password',401));
      }

   //3) If so update password
   User.password = req.body.password;
   User.passwordConfirm = req.body.passwordConfirm;
   await User.save();
   //4Log user in,send jwt
   createSendToken(User,200,res);
   });
