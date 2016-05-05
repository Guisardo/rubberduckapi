var port = process.env.PORT || 8010;
var mongohost = process.env.MONGO_HOST || 'mongodb';
var mongoport = process.env.MONGO_PORT || '27017';
var mongodbname = process.env.MONGO_DB || 'skein';
var mailhost = process.env.MAIL_HOST || 'mail';
var mailuser = process.env.MAIL_USER || '';
var mailpass = process.env.MAIL_PASS || '';

var express = require('express');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var app = express();

mongoose.connect('mongodb://' + mongohost + ':' + mongoport + '/' +
    mongodbname);
var duckieSchema = new Schema({
  duck_id: { type: String, default: '-' },
  external_ducks: { type: String, default: '' },
  data: { type: Object }
});
var Duck = mongoose.model('Duck', duckieSchema);

var fs = require('fs');
eval(fs.readFileSync('./libs/duck/PatternMatcher.js') + '');
eval(fs.readFileSync('./libs/duck/FitnessStateMachine.js') + '');

app.use('/dialog', function(req, res) {
  var query = req.query;
  var duck_id = query.duck_id;
  var answer = query.answer;

  Duck.findOne({'duck_id': duck_id}, 'duck_id data', function(err, duckDB) {
    var duckData = {};
    if (duckDB) {
      if (answer !== 'reset' && answer !== 'report') {
        duckData = duckDB.data;
      }
    } else {
      duckDB = new Duck();
      duckDB.duck_id = duck_id;
    }
    var duckie = new duck.FitnessStateMachine(duckData);
    var nextState = duckie.getNext(answer);
    duckDB.data = duckie;
    duckDB.save();
    res.setHeader('Content-Type', 'application/json');
    res.send(nextState);
  });
});

app.use('/fulldialog', function(req, res) {
  var query = req.query;
  var duck_id = query.duck_id;
  var external_ducks = query.external_ducks;

  Duck.findOne({'duck_id': duck_id}, 'duck_id data external_ducks',
      function(err, duckDB) {
    var duckData = {};
    if (duckDB) {
      duckData = duckDB.data;
    } else {
      duckDB = new Duck();
      duckDB.duck_id = duck_id;
    }
    var duckie = new duck.FitnessStateMachine(duckData);
    var report = duckie.getReport();
    if (external_ducks && report.dialog.length > 1) {
      duckDB.external_ducks = external_ducks;

      var nodemailer = require('nodemailer');

      // create reusable transporter object using the default SMTP transport
      var transporter = nodemailer.createTransport(
            'smtp://' + encodeURIComponent(mailuser) + ':' +
            encodeURIComponent(mailpass) + '@' + mailhost);

      var buildMailBody = function(report) {
        var result = '<b> This conversation started at: ' +
            report.start_time + '</b><br>';
        result += 'And lasted ' +
            Math.round((report.last_time - report.start_time) / 60000) +
            ' minutes<hr>';
        for (var i = 0; i <= report.dialog.length - 1; i++) {
          result += report.dialog[i].replace(/Q:/, '✆ >').replace(/A:/, '☹ >') +
              '<br>';
        }
        return result;
      };
      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: '"Rubber Duck ♨" <rubberduck@duckie.me>', // sender address
          to: external_ducks, // list of receivers
          subject: report.dialog[1].replace(/A:/, '') + ' ❔', // Subject line
          text: JSON.stringify(report), // plaintext body
          html: buildMailBody(report) // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
              return console.log(error);
          }
          console.log('Message sent: ' + info.response);
      });

      duckDB.save();
    }
    report['external_ducks'] = duckDB.external_ducks;

    res.setHeader('Content-Type', 'application/json');
    res.send(report);
  });
});

app.listen(port);
console.log('Rubber duck service started at', port);
