const stripe = require('stripe')('sk_test_51NVCO8SDmFSpJVExn9DMpIRl7LraLVgpDFmyLsfOE0Uu6imAsCzvLDBcweByflNd9BVKO67LM7vlzDt10A1tLIYd00eWw7pDby')
const Tour = require("./../models/tourModel");
const Booking = require("./../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require('./handlerFactory');


exports.getCheckoutSession = catchAsync(async(req,res,next) => {
    //1)Get the currently booked tour
    const reqTour = await Tour.findById(req.params.tourId);
    //2)Create a checkout session
    const session = await stripe.checkout.sessions.create({
        success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${reqTour.price}`,
        cancel_url: `${req.protocol}://${req.get("host")}/tour/${reqTour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${reqTour.name} Tour`,
                description: reqTour.summary,
                images: [
                  `${req.protocol}://${req.get("host")}/img/tours/${reqTour.imageCover}`,
                ],
              },
              unit_amount: reqTour.price * 100,
            },
            quantity: 1,
          },
        ],
        payment_method_types: ["card"],
        mode: "payment",
      });
    
   //3)Create session response
        res.status(200).json({
            status:"success",
            session  
        });
});

exports.createBookingCheckout = catchAsync(async(req,res,next)=> {
    const {tour , user , price}  = req.query;

    if(!tour && !user && !price) return next();

    await Booking.create({
        tour,
        user,
        price,
    })

    res.redirect(req.originalUrl.split('?')[0]);

});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

