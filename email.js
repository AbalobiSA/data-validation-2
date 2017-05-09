/*============================================================================
    Validation Mailer Module
 ============================================================================*/

const nodemailer = require('nodemailer');
// var fs = require("fs");

/*============================================================================
    Configuration
 ============================================================================*/

let smtpConfig = {
    host: process.env.EMAIL_SMTP_HOST,
    port: 587,
    secure: false, // use SSL
    auth: {
        user: process.env.EMAIL_SMTP_SENDER,
        pass: process.env.EMAIL_SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized:false
    }
};

/*============================================================================
    Functions
 ============================================================================*/

function send_report(body, subject, callback){

    let transporter;

    if (process.env.USE_GMAIL_ACCOUNT === true){
        console.log("USING GMAIL ACCOUNT!");
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_SENDER_USER,
                pass: process.env.EMAIL_SENDER_PASS
            }
        });
    } else{
        console.log("USING SMTP ACCOUNT!");
        transporter = nodemailer.createTransport(smtpConfig);
    }

    let mailOptions = {
        from: process.env.EMAIL_SMTP_SENDER, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        subject: "Abalobi Validation Report - " + subject, // Subject line
        text: body
    };

    transporter.sendMail(mailOptions, function(error, info){
        console.log(`Email Sender: Sending message to ${mailOptions.to}`);
        if(error){
            console.log(error);
            callback()
        }else{
            console.log('Message sent: ' + info.response);
            callback()
        }
    });
}

/*============================================================================
    Exports
 ============================================================================*/

module.exports = {
    send_report: send_report
};