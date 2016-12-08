module.exports = {

 send_report : function(body){

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'techairosmail@gmail.com', // Your email id
            pass: 'tech97531' // Your password
        }
    });

    var mailOptions = {
        from: 'techairosmail@gmail.com', // sender address
        to: 'arnovandermerwe39@gmail.com', // list of receivers
        subject: 'Heroku Validation Check', // Subject line
        text: body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            //res.json({yo: 'error'});
        }else{
            console.log('Message sent: ' + info.response);
            //res.json({yo: info.response});
        };
    });

}
}
