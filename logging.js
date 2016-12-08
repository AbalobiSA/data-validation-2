module.exports = {

  create_log : function(fs){

    var timestamp = new Date()

    fs.open('./logging.txt', 'a+',function(err, fd) {
      if (err) {
        return console.error(err);
      }
      fs.writeFile('./logging.txt', "Heroku validation job started at: " + timestamp + '\n\n' )
      console.log("Heroku validation job started at: " + timestamp + '\n\n')
      fs.close(fd)
    })
  },


  write_to_log : function(fs, text){

    fs.open('./logging.txt', 'a+',function(err, fd) {
      if (err) {
        return console.error(err);
      }
      fs.appendFile('./logging.txt', text)
      fs.close(fd)
    })
  },

  send_log_report : function(){

    var fs = require('fs')
    var MAILER =require('./email.js')
      fs.readFile('./logging.txt', 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        MAILER.send_report(data)

      });
  }


}
