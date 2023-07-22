const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
const router = express.Router();

// const reviewsController = require('../controllers/reviewController')
const reviewRouter = require('./reviewRoutes')



//router.param('id',tourController.checkId);

// app.get('/api/v1/tours',getAlltours);
// app.post('/api/v1/tours',createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch('/api/v1/tours/:id',updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyPlan);

router.route('/top-5-best&cheap').get(tourController.aliasTopTours,tourController.getAllTours);


router
 .route('/')
 .get(tourController.getAllTours)
 .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour);



router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.uploadTourImages,tourController.resizeTourImages,tourController.updateTour)
    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour);



//post tour/tourid/reviews   - It will create a review for the tour as per the Tourid
 //Get tour/tourid/review     - It will get all review for the tour as per the Tourid
 // router.route('/:tourId/review').post(authController.protect,authController.restrictTo('user'),reviewsController.createReview)
                               
router.use('/:tourId/reviews',reviewRouter)   //whenever '/:tourId/reviews' this url is found then redirect to reviewRouter
      

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
//tours-within/:300/centre/:40,-30/unit/:km


router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);


module.exports = router;