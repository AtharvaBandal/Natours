// here, we are implementing an error handling middleware function
// to dislay the error set by 'AppError' to the client

const AppError = require("../utils/appError");
const handleTokenExpiredErrorDB = () =>{
   return new AppError('Your Token expired!. Please login again!',401);
}
const handleJsonWebTokenErrorDB = () => {
   return new AppError('Invalid Token. Please login again!',401);
}

const handleValidationErrorDB = err =>{

   const errors = Object.values(err.errors).map(el => el.message);//it will loop over the data and create a array which will contain error messages for each error
   const message  = 'Invalid input data:--- '+errors.join('. ');
   return new AppError(message,400);

}


const handleDuplicateFieldsDB = err =>{
   const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
   const message = 'duplicate field value: '+value+' Please use a different vlaue for the field'
   return new AppError(message,400);

}


const handleCastErrorDB = err =>
{
    const message = 'Ivalid '+err.path+': '+err.value;
    return new AppError(message,400);
}

//Development mode

const sendErrorDev = (err,req,res) => {
   //1) API------------------------------------------
   if(req.originalUrl.startsWith('/api')){
      return res.status(err.statusCode)
      .json({
       status:err.status,
       error:err,
       message:err.message,
       stack:err.stack
      });
   }
      //2) RENDERED WEBSITE----------------------------  
      console.error('Error🔥',err);
      return  res.status(err.statusCode).render('error',{
         title:'something went wrong',
         msg : err.message
      });
     
}

//-----------------------------------------------------production mode----------------------------
 
const sendErrorProd = (err,req,res) => {
      //1)For API------------------------------
      
   if(req.originalUrl.startsWith('/api'))   
   {        
         if( err.isOperationa ) {                       //a)operational error
            return res.status(err.statusCode).json({
            status:err.status,
            message:err.message,   
           });
         }

             //1) Log error                              b)programming or other error , don't leak error details
        
         console.error('Error🔥',err);
         
         //2) send generic message 
         return res.status(500).json({
            status:'error',
            message:'something went wrong🔥' 
         });
   }     

   //2)  RENDERED WEBSITE:----------------------------------
   
         //a)operational Error    

         if(err.isOperational){       
            return res.status(err.statusCode).render('error',{
               title:'Something went wrong',
               msg:err.message
            });
         }

         //b)programming or other error , don't leak error details-----------------

            //1) Log error
            console.error('Error🔥',err);

            //2) send generic message 
            return  res.status(err.statusCode).render('error',{
               title:' something went wrong',
               msg:'Please try again later.......'
            });
};



module.exports = (err,req,res,next) => {

   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';
    
  if(process.env.NODE_ENV === 'development')
    {
         sendErrorDev(err,req,res);
    }  
  else 
        if(process.env.NODE_ENV ==='production') {
         
         

         let error = { ...err }
        error.message  = err.message
      

       //below converting mongo error into operational errors
        
      if(error.message === 'No tour found.')  sendErrorProd(error,req,res);

       
      if(error.name === 'CastError')   error = handleCastErrorDB(error);           // (invalid id)  //handleCastErrorDB this function send back the error which is operational error
      
      if(error.code === 11000) error = handleDuplicateFieldsDB(error);   //(duplicate tours fields)

      if(error.name === 'ValidationError') error = handleValidationErrorDB(error);  //invalid data in fields
      
      if(error.name = 'JsonWebTokenError') error = handleJsonWebTokenErrorDB(); //invalid token

      if(error.name = 'TokenExpiredError') error = handleTokenExpiredErrorDB(); //expired token

      

     sendErrorProd(error,req,res);
   }
};