/**
 * Created by crypto on 17/09/2016.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// create table user
var Client = new mongoose.Schema({
    _id: Number,
    username: String,
    email: String,
    WatchedOutChat: [String],
    isAdmin: Boolean,
    password: String
});

// generate a hash
Client.methods.generateHash = function(password) {
    // return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    var pass = 'test'+password;
    return crypto.createHash('sha256').update(pass).digest('base64');
};

// check valid password
Client.methods.validPassword = function(password) {
    // return bcrypt.compareSync(password, this.password);
    var pass = 'test'+password;
    return comparePassword(pass, this.password);
};

comparePassword = function(data, encrypted) {
    if(typeof data != "string" ||  typeof encrypted != "string") {
        throw "Incorrect arguments";
    }

    var encrypted_length = encrypted.length;

    var same = true;
    var hash_data = crypto.createHash('sha256').update(data).digest('base64');
    var hash_data_length = hash_data.length;

    same = hash_data_length == encrypted_length;

    var max_length = (hash_data_length < encrypted_length) ? hash_data_length : encrypted_length;

    // to prevent timing attacks, should check entire string
    // don't exit after found to be false
    for (var i = 0; i < max_length; ++i) {
        if (hash_data_length >= i && encrypted_length >= i && hash_data[i] != encrypted[i]) {
            same = false;
        }
    }

    return same;
}

module.exports = mongoose.model('Client', Client)
