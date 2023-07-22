const mongoose = require("mongoose"); // requiring mongoose module for connecting to MongoDB
const slugify = require("slugify");   //before this npm i slugify 
const validator = require("validator");
// const User = require("./userModel");
// creating a schema for our database
const tourSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A tour must have a name"],
    unique: true,
    trim: true,
    maxlength : [40,'It must have at most or equal to 40 characters'],   //Data validators
    minlength : [9,'It must have atleast or equal to 9 characters'],

    validate :  [validator.isAlpha,'name must only contain characters']      //data validation used from validator libray. isAlpha checks if the input contains only characters

  },
  slug: String,
  
  duration: {
    type: Number,
    required: [true, "A tour must have a duration"],
  },
  maxGroupSize: {
    type: Number,
    required: [true, "A tour must have a group size"],
  },
  difficulty: {
    type: String,
    required: [true, "A tour must have a difficulty"],
    enum : {
      values : ['easy', 'difficuilt','medium' ],
      message : ['It must be either easy,medium or difficuilt ']
    } 
  },
  ratingsAverage: {
    type: Number,
    default: 4,
    min : [1,'Rating must be above 1.0'],
    max : [5,'Ratings must be below 5.0'],
    set : val=> Math.round(val*10) / 10   //used to roundoff teh avg ratings
     
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, "A tour must have a price"],
  },
  priceDiscount:
  {
        type : Number,
    validate :
    {
       validator : function(val) {    //this is a custom validator whre val represents the priceDiscount
          
      return val < this.price; //"this" here only points to current doc on new document creation hence we can't use this while updating the tour 
        },
       message : 'Price should always be greater than discount value'
    },
  },
  summary: {
    type: String,
    trim: true,
    required: [true, "A tour must have a description"],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, "A tour must have a cover image"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, // this option makes sure that 'createdAt' is not returned.
  },
  startDates: [Date],
  secretTour:{
    type:Boolean,
    default : false
  },



  startLocation:{
    //GeoJSON
    type:{
      type:String,
      default:'point',
      enum:['point']
    },
    coordinates:[Number],
    address:String,
    description:String
  },
  locations:[         //this need to be an array of objects to be a document so that it can be embedded in the tour document
     {
      type:{
        type:String,
        default:'point',
        enum:['point']
      },
      coordinates:[Number],
      address: String,
      description: String,
      day: Number,
     }
   ],
  //  guides: Array
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    }
  ]

},
    {
    toJSON : {virtuals: true},
    toObject : {virtuals: true}
    }
);

//Improving Read Performance with Indexes

tourSchema.index({price:1,ratingsAverage:-1});
tourSchema.index({slug:1});
tourSchema.index({startLocation:'2dsphere'});



//creating virtual property for adding field duration in weeks

tourSchema.virtual('durationWeeks').get(function(){
  return this.duration/7;
})

//virtual populating
tourSchema.virtual('reviews',{
  ref: 'Review',
  foreignField: 'tour',
  localField:'_id'
});

//moongoose 1) Document middleware :- runs before .save() & .create()

tourSchema.pre('save',function(next){
  this.slug = slugify(this.name,{lower:true});

  next();   
});

//Embedding guides in the tour document itself

// tourSchema.pre('save',async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next(); 
// });

// tourSchema.post('save',function(doc,next){
//      console.log(doc);
//      next();    
// });

//2) Query middleware 
//:- runs before .find() & all .find....

tourSchema.pre(/^find/,function(next){     ///^find/ =  All strings which stars with "find" keyword

   this.find({secretTour:{$ne:true}});    // ne:(not equal)        all tours having secretTour field true will not be included when find() is called.   
    
   this.start = Date.now();     // returns in miliseconds
   next();                                        

});


tourSchema.pre(/^find/,function(next){
  this.populate({
    path : 'guides',
    select : '-__v -passwordChangedAt'
  });
  next();
});




//:- runs after .find() & all .find....

tourSchema.post(/^find/,function(docs,next){
   //console.log('Query took ' + this.start + ' miliseconds to complete');
   next();
});

//Aggregation middleware

// tourSchema.pre('aggregate',function(next){
// this.pipeline().unshift({$match : {secretTour : { $ne:true } } }); //adds match stage to pipeline which is a array that is why unshift is used to add match at the beginning of the array      
//  next();
// });



// creating a model based on our defined schema. We can create objects on this model
const tour = mongoose.model("tour", tourSchema);

module.exports = tour; // exports the model we made