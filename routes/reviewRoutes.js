const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const router = express.Router({mergeParams: true});

router.use(authController.protect)      //This is a middleware function where authcontroller.protect will be called for all routes after this middleware function

router
 .route('/')
 .get(reviewController.getAllReviews)
 .post(authController.restrictTo('user'),reviewController.setTourUserIds, reviewController.createReview );



router
 .route('/:id')
 .get(reviewController.getReview)
 .delete(authController.restrictTo('admin','user') ,reviewController.deleteReview)
 .patch(authController.restrictTo('admin','user'),reviewController.updateReview);

module.exports = router;