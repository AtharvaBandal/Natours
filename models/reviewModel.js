const mongoose = require("mongoose");
const Tour = require("./tourModel")

const reviewSchema = new mongoose.Schema({

    review: {
        type:String,
        required:[true,'Review cannot be empty ' ]

    },
    rating: {
        type: Number,
        min:1,
        max:5
    },
    createdAt: {
        type: Date,
    default: Date.now()
    },
    tour:{
        type: mongoose.Schema.ObjectId,
       ref:'tour',
       required:[true,'Review must belong to a tour']
    },
    user : {
        type: mongoose.Schema.ObjectId,
       ref:'user',
       required:[true,'Review must belong to a user']
    }

},
{
    //used to show virtual properties as output
    toJSON : {virtuals: true},
    toObject : {virtuals: true}
}
);

reviewSchema.index({tour:1 ,user:1},{unique:true});



reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //   path : 'tour',
    //   select :'name'
    // }).populate({
    //     path : 'user',
    //     select : 'name photo'
    //   });

    this.populate({
            path : 'user',
            select : 'name photo'
          });
    next();
  });

reviewSchema.statics.calAverageRating = async function(tourId){
    const stats = await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
        $group:{
            _id: '$tour',
            nRating:{$sum:1},
            avgRating:{$avg:'$rating'}
        }
       }
    ]);
//console.log(stats);
if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId,{
       
        ratingsQuantity:stats[0].nRating,
        ratingsAverage:stats[0].avgRating,
    });  
}
else{
    await Tour.findByIdAndUpdate(tourId,{
        ratingsQuantity : 0,
        ratingsAverage: 4.5
    })
}
};

reviewSchema.post('save',function(){
    //this points to current review
    this.constructor.calAverageRating(this.tour);
    
});

//updating ratings for updated reviews
reviewSchema.pre(/^findOneAnd/,async function(next){
    //here query is performed and tour id is there in "r" object
    this.r = await this.findOne();                     
    next();
})

reviewSchema.post(/^findOneAnd/,async function(){
    //here findOne() will not be executed because it is already executed in the above middleware
   // here average  rating function is called were tour id of "r" is passes
   await this.r.constructor.calAverageRating(this.r.tour);
})
   
const Review = mongoose.model('Review',reviewSchema);
module.exports =  Review;  