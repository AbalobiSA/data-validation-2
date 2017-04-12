module.exports = {

    send_report : function(body, subject, callback){

        var nodemailer = require('nodemailer');

        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_SENDER_USER, // Your email id
                pass: process.env.EMAIL_SENDER_PASS // Your password
            }
        });

        var mailOptions = {
            from: process.env.EMAIL_SENDER_USER, // sender address
            to: process.env.EMAIL_RECEIVER, // list of receivers
            subject: "Abalobi Validation Report - " + subject, // Subject line
            text: body
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                callback()
            }else{
                console.log('Message sent: ' + info.response);
                callback()
            }
        });

    }
};
