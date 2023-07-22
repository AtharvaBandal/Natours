const user = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const multer = require('multer');   //used for uploading photos
const sharp = require('sharp');    //used for resizing images
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');


//1st way here image is saved on the disk at the destination

// const multerStorage = multer.diskStorage({       
//   destination: (req, file, cb) =>{
//     cb(null,'public/img/users' )
//   },

//   filename: (req, file, cb) =>{
//     const extension  = file.mimetype.split('/')[1];
//     cb(null,`user-${req.user.id}-${Date.now()}.${extension}`)
//   }
// });


//2nd way here image is saved on the memory buffer
const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) =>
{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
  }
  else{
  cb(new AppError('Not an image! Please upload only images.',400),false);
  } 
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});     

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req,res,next ) => {

  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;  //giving the filename to the image   
  
  await sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`)
  next(); 
}


const filterObj = (obj, ...alloweFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(alloweFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj
}


// exports.getAllusers = catchAsync(async(req, res)=>{
//     const users = await user.find();  ;
//     if(!users)
//     {
//       return next(new AppError('No user found' ,404));
//     }
//     // sending a response
//     res.status(200).json({
//       results: users.length,
//       status: "success",
//       data: {
//         users
//       },
//     });

// });
exports.getAllusers = factory.getAll(user);

exports.getMe = (req,res,next) => {
  req.params.id = req.user.id;
  next();

}


exports.updateMe = catchAsync(async(req, res,next)=>{
  //1)Create error if user wants to update password from this route
  if(req.body.password||req.body.passwordConfirm)
  {
    return next(new appError('This route is not for password update. Please use  the /updateMyPassword route',400))
  }
  //2)Filter out unwanted fields names that are not allowed to be updated

  const filteredBody = filterObj(req.body,'name','email'); //we need to filter some unwanted fields of the body as we can't allow user to upadte them
  if(req.file) filteredBody.photo = req.file.filename;

  //3) Update User document
  const updatedUser  = await user.findByIdAndUpdate(req.user.id,filteredBody,{new:true,runValidators:true});    //Here req.user.id comes from authorization in postman where bearer token is recieved
 
  
  res.status(200).json({
      status:'success',
      data:{
      user: updatedUser
      }
   });
});


exports.deleteMe = catchAsync(async(req,res,next)=>{
  await user.findByIdAndUpdate(req.user.id,{active:false})

  res.status(204).json({
    status:'success',
    data:null
  })
})

exports.getUser =  factory.getOne(user);    


exports.createUser =async(req, res,next) => {
response.status(500).json({
  status:'error',
  message:"please use '/signUp' route for creating user"
    });
}    

exports.updateUser = factory.updateOne(user); //Do not update passwords with this !!!!

exports.deleteUser = factory.deleteOne(user);

