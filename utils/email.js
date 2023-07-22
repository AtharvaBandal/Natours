const nodemailer = require('nodemailer');                 //npm install nodemailer@4.7.0 
const pug = require('pug');                 
const { convert } = require("html-to-text");
const Transport = require("nodemailer-brevo-transport");

module.exports = class Email {
    constructor(user,url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Atharva <${process.env.EMAIL_FROM}>`;

    }

    
    newTransport() {
        // if we are in production, send real emails
        if (process.env.NODE_ENV === "production") {
          // implementation for real emails here.
          return nodemailer.createTransport(
            new Transport({ apiKey: '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' }));
        }
        
        //2) In development mode 
         return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth : {
                user : process.env.EMAIL_USERNAME,
                pass : process.env.EMAIL_PASSWORD
            }
        });
    }

    
    
    //Sends the actual email(Main function)------------------------------------
    async send(template,subject)
    {
     //1) Render html based on pug template
     const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
        firstName:this.firstName,
        url: this.url,
        subject
      });


     //2)Define Email Options

        const mailOptions = {
        from : this.from,
        to :    this.to,
        subject,
        html, 
        text : convert(html) 
        };
     //3)Create transport and send email

        await this.newTransport().sendMail(mailOptions);
    }

    
    
   async sendWelcome(){
        await this.send('welcome','welcome to the natours family')
    }
    
    async sendPasswordReset(){
         await this.send('passwordReset','Your password token is valid for only 10 mins');
     }

}


   
