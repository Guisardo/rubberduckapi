var port = process.env.PORT || 8010;
var mongohost = process.env.MONGO_HOST || 'mongodb';
var mongoport = process.env.MONGO_PORT || '27017';

var express = require('express');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var app = express();

mongoose.connect('mongodb://' + mongohost + ':' + mongoport + '/skein');
var duckieSchema = new Schema({
  duck_id: { type: String, default: '-' },
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
            if (answer !== 'reset') {
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
        res.send(nextState);
    });
});

app.use('/fulldialog', function(req, res) {
    var query = req.query;
    var duck_id = query.duck_id;

    Duck.findOne({'duck_id': duck_id}, 'duck_id data', function(err, duckDB) {
        var duckData = {};
        if (duckDB) {
            duckData = duckDB.data;
        } else {
            duckDB = new Duck();
            duckDB.duck_id = duck_id;
        }
        var duckie = new duck.FitnessStateMachine(duckData);
        var report = duckie.getReport();
        res.send(report);
    });
});

app.listen(port);
console.log('Rubber duck service started at', port);
