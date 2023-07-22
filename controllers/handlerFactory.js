const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIfeatures = require("./../utils/apiFeatures");


exports.deleteOne = Model => catchAsync(async (req,res,next) => {
  
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc)
    {
      return next(new AppError('No Document found with that ( '+req.id+' ) Id',404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });

});

exports.updateOne = Model => catchAsync(async (req,res,next) => {
  
    const doc = await Model.findByIdAndUpdate(   req.params.id , req.body  , {new: true,runValidators: true}     );

    if(!doc)
    {
      return next(new AppError('No document found with that ( '+req.id+' ) Id',404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data:doc
      },
    });
});

exports.createOne = Model => catchAsync(async (req,res,next) => {
    const doc = await Model.create(req.body); 

    res.status(201).json({
      status: "success",
      data: {
        data:doc 
      },
    });
});

exports.getOne = (Model,popOptions) => catchAsync(async (req,res,next) =>{     //pop:-populate
   let query = Model.findById(req.params.id);
   if(popOptions) query = query.populate(popOptions);

    const doc = await query;

     
    if(!doc)
    {
      return next(new AppError('No document found with that ( '+req.id+' ) Id',404));
    }


    res.status(200)
       .json({
        status: "success",
        data: {
         data:doc,
        },
    });

});

exports.getAll = Model => catchAsync(async (req, res) => {
// to allow for nested getall reviews on a tour
    let  filter = {};
    if(req.params.tourId) filter = {tour:req.params.tourId}
  
    
    // running different API features on 'features' object
    const features = new APIfeatures(Model.find(filter), req.query) // passed the entire tour object by 'tour.find()' and query string by 'req.query'
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
   
    // sending a response
    res.status(200).json({
      results: doc.length,
      status: "success",
      data: {
        data:doc,
      },
    });
  

});