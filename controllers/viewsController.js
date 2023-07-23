const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


exports.getOverview =catchAsync(async(req,res,next)=>{
 //1)Get tour data from the collection
  const tours = await Tour.find();

 //2)Build the template

//3)Render that template using tour data

    res.status(200).render('overview',{
        title:'All tours',
        tours
    });
} );

exports.getTour =catchAsync(async(req,res,next )=>{
    //1)get the data, for requested tour(including reviews & guides)
       const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path:'reviews',
        fields:'reviews rating user'
       });

       
       if(!tour)
       { 
           return next(new AppError('No tour found.',404));
        }
        
        
        //2) Build template  
        
        //3) Render template using data from 1)
        
        res.status(200).render('tour',{
            title: `${tour.name} Tour`,
            tour
        });
    }) 



exports.getMyTour = catchAsync(async(req,res)=>{
    
    //1)Find all bookings
    const bookings = await Booking.find({user: req.user.id})
    //2)Find tours with returned Id's

    const tourIds = bookings.map(el => el.tour);
   
    const tours = await Tour.find({ _id: { $in: tourIds }})

    res.status(200).render('overview',{
       
        title: `My Tours`,
        tours
    });
}); 








exports.getSignupForm = catchAsync((req,res)=>{


    res.status(200).render('signup',{
        title: `New account`,
    });

})


exports.getLoginForm = catchAsync((req,res)=>{


    res.status(200).render('login',{
        title: `Log into your account`,
    });

})

exports.getAccount = (req,res)=>{
   
    res.status(200).render('account',{ 
        title: `Your account`
    });
};



exports.updateUserData = catchAsync(async(req,res,next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id,{
    name: req.body.name,
    email: req.body.email
   },
   {
    new: true,
    runValidators: true
   })
    
   res.status(200).render('account',{
    title: `Your account`,
    user:updatedUser
    });
});

