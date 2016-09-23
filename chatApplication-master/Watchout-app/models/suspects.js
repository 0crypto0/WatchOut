/**
 * Created by crypto on 16/09/2016.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// create table user
var Suspect_Details = new mongoose.Schema({
    ip: String,
    KnownAliases: [String],
    ThreatLevel: Number
});

var Suspect = new mongoose.Schema({
    ip: String,
    KnownAliases: [String],
    KnownAssociates: [Suspect_Details],
    ThreatLevel: Number
});

module.exports = mongoose.model('Suspect', Suspect)