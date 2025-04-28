var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var landmarkSchema = new Schema({
	'name' : String,
	'coordinates' : String,
	'category' : String
});

module.exports = mongoose.model('landmark', landmarkSchema);
