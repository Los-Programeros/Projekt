var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var sensorDataSchema = new Schema({
	'user' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'userActivity' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'userActivity'
	},
	'date' : Date,
	'coordinates' : String,
	'accelerometer' : String
});

module.exports = mongoose.model('sensorData', sensorDataSchema);
