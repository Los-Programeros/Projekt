var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var userActivitySchema = new Schema({
	'user' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'date' : Date,
	'visited' : Array
});

module.exports = mongoose.model('userActivity', userActivitySchema);
