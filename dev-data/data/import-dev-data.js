const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
 
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');
const { dirname } = require('path');
dotenv.config({path:'./.env'});



//1) connecting to MongoDb database  using mongoose
const DB = process.env.DATABASE.replace('<password>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
}).then(() => {console.log('Db successfully connected');})

//Reading json file
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
//  const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
  const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
 //Import data into database

 const importData = async () =>{
     try{
        //await Tour.create(tours);
        //  await Review.create(reviews);
         await User.create(users);
         console.log('Data successfully imported');
     }
     catch(err){
         console.log(err);
     }
     process.exit();
   }

//delete data from database

const deleteData = async () =>{
    try{
        await User.deleteMany();
        // await Review.deleteMany();
        // await Tour.deleteMany();
        console.log('Tour successfully deleted');
    }
    catch(err){
        console.log(err);
    }
    process.exit();

}   

if(process.argv[2] === '--import')
 importData();
else if(process.argv[2] === '--delete')
 deleteData();
