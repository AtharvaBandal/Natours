const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async(req,res,next)=>{
//     let  filter = {};
//     if(req.params.tourId) filter = {tour:req.params.tourId}
//     console.log(filter);
//     const reviews = await Review.find(filter);


//     res.status(200)
//         .json({
//             status:'success',
//             results:reviews.length,
//             data:{
//                 reviews
//             }
//         })
// });
 
exports.getAllReviews = factory.getAll(Review)

exports.setTourUserIds = (req, res, next) =>{                         //middleware function for createReview
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createReview = factory.createOne(Review); 

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getReview =  factory.getOne(Review);
