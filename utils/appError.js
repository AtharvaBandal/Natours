class AppError extends Error {        //inbuilt error class
    constructor(message , statusCode){
        super();             //Super is used to call the constructor of its parent class i.e(Error) to access the parent's properties and methods.
        this.message = message;
        this.statusCode = statusCode;
        this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor)


    }
}

module.exports = AppError