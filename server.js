
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

//This handles the exceptions which are uncaught.    eg.console.log(x)   and x is not defined
process.on('uncaughtException',err =>{
    console.log('Uncaught Exception!🔥🔥....Shutting Down');
    console.log(err.name,':- ',err.message);
    process.exit(1);                                        //closes program
    });

const app = require('./app');

//1) connecting to MongoDb database  using mongoose
const DB = process.env.DATABASE.replace('<password>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(() => {console.log('Db successfully connected');})

 
const server = app.listen(3000||process.env.PORT,() =>   { 
    console.log('running on server port 3000');
});

//This handles the promises that are rejected and unhandled outside express.    eg.DB not connected
process.on('unhandledRejection',err =>{
    console.log('Unhandled Rejection!🔥🔥....Shutting Down');
    console.log(err.name,err.message);
    server.close(()=>{                                          //shutting down server but all promises are completed
        process.exit(1);                                        //closes program
    });
});

