var mongoose = require('mongoose');

// create table message
var Word = new mongoose.Schema({
    _id: Number,
    rating: Number,
    content: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    last_modified: Date
});

module.exports = mongoose.model('Word', Word)
