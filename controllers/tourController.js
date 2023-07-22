// requiring dependencies
const tour = require("./../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require('./handlerFactory');
const { json } = require("express");
const multer = require('multer');   //used for uploading photos
const sharp = require('sharp');     //used for resizing images




const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) =>
{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
  }
  else{
  cb(new AppError('Please upload only images.',400),false);
  } 
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});     


exports.uploadTourImages =upload.fields([
  { name: 'imageCover', maxCount:  1 },
  { name: 'images', maxCount: 3 } 
]);

//upload.single('image')    req.file
//upload.array('image' , 5)    req.files



exports.resizeTourImages =catchAsync( async (req,res,next) => {
  
   if(!req.files.imageCover || !req.files.images) return next(); 
  
  //1)cover Image 
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
   await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${ req.body.imageCover}`);
    // console.log("zzzzzzzzzzz"); 

  //2) Images  
  req.body.images = [];

  await Promise.all (
    req.files.images.map(async (file,i) => {

      const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${filename}`);
   
      req.body.images.push(filename)
    })
  );
  next(); 
});


// route handlers
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
}; // this is a middleware function to pre-set the query parameters for 'top-5-best&cheap'


exports.getAllTours = factory.getAll(tour)

// exports.getAllTours = catchAsync(async (req, res) => {
  
//     // EXECUTING A QUERY

//     // running different API features on 'features' object
//     const features = new APIfeatures(tour.find(), req.query) // passed the entire tour object by 'tour.find()' and query string by 'req.query'
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();
//     const tours = await features.query;
//     if(!tour)
//     {
//       return next(new AppError('No tour found ',404));
//     }
//     // sending a response
//     res.status(200).json({
//       results: tours.length,
//       status: "success",
//       data: {
//         tours,
//       },
//     });
  

// });

exports.getTour =  factory.getOne(tour , {path: 'reviews' })

// exports.getTour = catchAsync(async (req,res,next) => {

//      const Tour = await tour.findById(req.params.id).populate('reviews');
//    //const reqTour = await tour.findOne({_id:req.params.id});
     
//     if(!Tour)
//     {
//       return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
//     }


//     res.status(200)
//        .json({
//         status: "success",
//         data: {
//          Tour,
//         },
//     });
  
  
// });

exports.createTour =factory.createOne(tour); 


// exports.createTour = catchAsync(async (req,res,next) => {
  
//     // const newTour = new tour({})
//     // newTour.save()
//     const newTour = await tour.create(req.body); // alternative for this given above

//     if(!newTour)
//     {
//       return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
//     }

//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour,
//       },
//     });
  
  
// });

exports.updateTour =factory.updateOne(tour); 


// exports.updateTour = catchAsync(async (req,res,next) => {
//             const updated = await tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//      });
// if(!updated)
//     {
//       return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
//     }

//     res.status(200).json({
//       status: "success",
//       data: {
//         updated,
//       },
//     });

  
//  });

exports.deleteTour = factory.deleteOne(tour);

// exports.deleteTour = catchAsync(async (req,res,next) => {
  
//     const deleted = await tour.findByIdAndDelete(req.params.id);
//     if(!deleted)
//     {
//       return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
//     }
//     res.status(204).json({
//       status: "success",
//       data: null,
//     });

// });

exports.getTourStats = catchAsync(async (req,res,next) => {

  const stats  = await tour.aggregate([
    {
      $match : {ratingsAverage : {$gte:4.5} },
    },
    {
      $group:{
        _id : {$toUpper:'$difficulty'},
        numTours : {$sum:1}, 
        numRatings : {$sum:'$ratingsQuantity'},
        avgRating : {$avg:'$ratingsAverage'},
        avgPrice :{$avg:'$price'},
        minPrice : {$min:'$price'},
        maxPrice : {$max:'$price'}

      }
    },
    {
      $sort:{avgPrice:1}    //sort according to avg price and 1 means in accending order
    }
  ]);
  if(!stats)
    {
      return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
    }

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan= catchAsync(async (req,res,next) =>
{
  
    const year = req.params.year*1;
    
    const plan = await tour.aggregate([
         {
          $unwind: '$startDates'//it shows single tour for date i.e one tour may be displayed multiple times 
         },
         {
          $match: {
            startDates: {
              $gte:new Date(year+"-01-01"),
              $lte:new Date((year)+"-12-31"),   
            }
          }
        },
        {
          $group: {                               //it groups according to the _id field
            _id : { $month : '$startDates'},
            numTourStarts : {$sum : 1},
            name : {$push : '$name'}
          }
        },
        {
          $addFields : {month:'$_id'}
        },
        {
          $project:{
            _id : 0       //this makes Id field disappear 
          },
        },
          {
            $sort:{ numTourStarts: -1   }       //it sorts according to numTourStarts field and (-1) indicates that it sorts in descending order
          }  
        
     ]);
     if(!plan)
    {
      return next(new AppError('No tour found with that ( '+req.id+' ) Id',404));
    }
     
    res.status(200).json({
      status: "success",
      data: {
        plan
      },
    });
});

//tours-within/300/center/40,-30/unit/km
exports.getToursWithin =  catchAsync(async(req,res,next)=>{
  const {distance , latlng , unit} = req.params;
  const [lat,lng] = latlng.split(',');

  const radius = unit ==='mi' ? distance/3963.2 : distance/6378.1

  if(!lat || !lng){
    next(new AppError('Please provide appropriate latitude ane longitude in the format lat,lng',400));
  }

  else{
    const tours = await tour.find({startLocation:{ $geoWithin:{$centerSphere:[[lng,lat],radius]} } 
  });
  // console.log(tours);
  // console.log(lat,lng);
  res.status(200).json({
  status:"success",
  results:tours.length,
  data:{
    data:tours
  }
  });
  } 
});

exports.getDistances = catchAsync(async (req,res,next)=>{
  const {latlng , unit} = req.params;
  const [lat,lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if(!lat || !lng){
    next(new AppError('Please provide appropriate latitude ane longitude in the format lat,lng',400));
  }
  const distances = await tour.aggregate([
  {
    $geoNear:{
      near:{
        type : 'Point',
        coordinates : [lng * 1 , lat * 1]
      },
      distanceField:'distance',
      distanceMultiplier: multiplier     //convert the distance from meters to KM 
    } 
  },
  {
    $project:{
      distance : 1,
      name : 1
    }
  }
  ]);
  res.status(200).json({
    status:"success",
    data:{
      data:distances
    }
  });
});