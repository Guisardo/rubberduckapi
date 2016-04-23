var express = require('express');
var mongoose = require('mongoose');

var app = express();

mongoose.connect('mongodb://localhost/my_database');
var duckieSchema = new Schema({
  duck_id: { type: String, default: '-' },
  data: { type: Object }
});

var fs = require('fs');
eval(fs.readFileSync('./libs/duck/PatternMatcher.js') + '');
eval(fs.readFileSync('./libs/duck/FitnessStateMachine.js') + '');

app.use('/getnext', function(req, res) {
    var duckie = new duck.FitnessStateMachine();
    nextState = duckie.getNext();
    res.send(nextState);
});

var port = process.env.PORT || 8010;
app.listen(port);
console.log('Rubber duck service started at ', port);
