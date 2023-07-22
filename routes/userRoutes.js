const express = require('express');
// const { router } = require('../app');
const usercontroller = require('../controllers/userController');
const authController = require('./../controllers/authController');

 

const userRouter = express.Router();

userRouter.post('/signup',authController.signup);
userRouter.post('/login',authController.login);
userRouter.get('/logout',authController.logout);
userRouter.post('/forgotPassword',authController.forgotPassword);
userRouter.patch('/resetPassword/:token',authController.resetPassword); 

userRouter.use(authController.protect)  //This is a middleware function where authcontroller.protect will be called for all routes after this middleware function

userRouter.patch('/updateMyPassword',authController.updatePassword);

userRouter.patch('/updateMe',usercontroller.uploadUserPhoto,usercontroller.resizeUserPhoto,usercontroller.updateMe)
userRouter.delete('/deleteMe',usercontroller.deleteMe)
userRouter.get('/getMe',usercontroller.getMe,usercontroller.getUser)

userRouter.use(authController.restrictTo('admin'));  //This is a middleware function where authcontroller.restricto() will be called for all routes after this middleware function



userRouter.route('/').get(usercontroller.getAllusers).post(usercontroller.createUser);
userRouter.route('/:id').get(usercontroller.getUser).patch(usercontroller.updateUser).delete(usercontroller.deleteUser);

module.exports = userRouter;