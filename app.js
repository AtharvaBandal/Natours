const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');   //npm i express-rate-limit
const helmet = require('helmet');                  //npm i helmet 
const mongoSanitize= require('express-mongo-sanitize');  //npm i express-mongo-sanitize
const xss  = require('xss-clean'); //npm i xss-clean 
const hpp = require('hpp'); //npm i hpp
const cookieParser = require('cookie-parser'); //npm i cookie-parser
const compression = require('compression');
const cors = require('cors'); 

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter  = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes')
const AppError = require('./utils/appError');
const  globalErrorHandler = require('./controllers/errorController');

const bookingController = require('./controllers/bookingController');
 
 
const app = express(); 

app.set('view engine', 'pug');
 app.set('views',path.join(__dirname,'views'));

//Implement Cors
app.use(cors())

app.use(express.static(`${__dirname}/public`));   //it defines that all the static assets will be automatically served from a folder called public



//development logging
if(process.env.NODE_ENV === 'development')
{app.use(morgan('dev')) ;  } 

//API Limiting
//This middleware function is used to protect against brut force attacks and limit number of requests from a single IP
const limiter = rateLimit({
    max: 100,                          //maximum requests
    windowMs: 60 * 60 * 1000,             //in an hour(milliseconds)
    message: 'Too many request from this IP,please try again in an hour!'
});
   app.use('/api',limiter);

app.post('/webhooks-checkout',express.raw({type:'application/json'}),bookingController.webhookCheckout );


app.use(express.json({limit: '10kb' }));                      //makes req.body accessible for api requests(body parser)
app.use(cookieParser());                                      //makes req.cookies accessible
app.use(express.urlencoded({extended:true,limit:'10kb'}))      //makes req.body accessible when forms are submitted




//Data sanitization against Nosql query injection

app.use(mongoSanitize());

// Data sanitization against XSS

app.use(xss()); 

//prevent parameter pollution. This does'n allow duplicates in query strings
app.use(hpp({
    whitelist: [        //this list allow duplicates in query strings
     'duration',
     'ratingsQuantity',
     'ratingsAverage',
     'maxGroupsize',
     'difficulty',
     'price'
    ]
}));                    


app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // next() is used to call the next middleware function
});

// Routes


app.use('/',viewRouter)                              //web request
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.use(compression());// It will compress text thats will be send to the client


//If above routes don't work then this will work else the below route won't work

app.all('*',(req,res,next) => {
next(new AppError('cannot find ('+req.originalUrl+') on this server!' , 404));  //error is send AppError class and then returned thing to the global error handling middleware
});

//global error handling middleware  for only operational errors  
 app.use(globalErrorHandler);




// Further HELMET configuration for Security Policy (CSP) for maps

const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
 
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls]
    }
  })
);
 


//4) start server
module.exports = app;
