const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true,'Please enter your name'],
         
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: [true,'Please enter your email address'],
        validate : [validator.isEmail,'provide a valid email address']
    },
    photo:{
        type: String,
        default:'default.jpg'
    },
    role : {
        type:String,
        enum : ['user','admin','guide','lead-guide'],
        default: 'user'

    },
    password:{
          type: String,
          required:[true,'Please provide a password'],
          select:false
      
    },
    passwordConfirm: {
        type: String,
        // required: [true, 'Please confirm your password'],
        validate: {
          // This only works on CREATE and SAVE!!!
          validator: function(el) {
            return el === this.password;
          },
          message: 'Passwords are not the same!'
        }
      },
      passwordChangedAt: Date,
      passwordResetToken:String,
      passwordResetExpires:Date,
      active:{
        type:Boolean,
        default:true,
        select:false
      }

      
});



userSchema.pre(/^find/,function(next){   //this middleware function runs before every "find" query

this.find({active:{$ne:false}});    //finds only active users
  next();
});



userSchema.pre('save', function(next){

if(!this.isModified('password')||this.isNew)return next();
 
this.passwordChangedAt = Date.now() - 1000;
next();

});

//Encrypt password (Password management)

userSchema.pre('save', async function(next){       // this middleware function runs between getting data and saving data into database
   //runs only if password are modified
    if(!this.isModified('password'))
        return next();

  //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password,12)    //this encrypts the password
   
    //delete the passwordconfirm field 
    this.passwordConfirm = undefined;    //This field is deleted and is not added to the database
     next();
});
    
 // correctpassword function to check if typed candidate === userPassword
 userSchema.methods.correctPassword = async function(candidatePassword,userPassword)
{
        return await bcrypt.compare(candidatePassword,userPassword);
};

     
     //finction to check if password is changed after token was issued
    userSchema.methods.changedPassword = function(JWTTimestamp) {
        if(this.passwordChangedAt){
            const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
            return JWTTimestamp < changedTimestamp;
        }
           return false;
}


userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');   //resetpassword created

  this.passwordResetToken = crypto  //Created password is encrypted 
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //expires in 10 minutes

  return resetToken;            //This unencrypted password is returned to send this to user via email
};

const user = mongoose.model('user',userSchema);

module.exports = user;