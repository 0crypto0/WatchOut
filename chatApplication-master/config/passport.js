var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');
var Online = require('../app/models/online');
var Counter = require('../app/models/counter');
var Client = require('../Watchout-app/models/client');
var Suspect = require('../Watchout-app/models/suspects');
var SuspeciousWord = require('../Watchout-app/models/suspeciouswords');

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.serializeClient(function(client, done) {
		done(null, client._id);
	});

	passport.deserializeUser(function(id, done) {
		Client.findById(id, function(err, client) {
			done(err, client);
		});
	});

	passport.use('singup', new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, done) {
			process.nextTick(function() {
				User.findOne({ 'username': username }, function(err, user) {
					if (err) return done(err);
					if (user) {
						return done(null, false, req.flash('singupMessage', 'That username is already taken.'));
						console.log("That username is already taken");
					} else {
						createUser(username, req.param('name'), password, done);
					}
				});
			});
		}
	));

	passport.use('WatchOut-signup', new LocalStrategy({
			usernameField: 'username',
		    emailField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, email, done) {
			process.nextTick(function() {
				Client.findOne({ 'username': username }, function(err, client) {
					if (err) return done(err);
					if (client) {
						return done(null, false, req.flash('singupMessage', 'That username is already taken.'));
						console.log("That username is already taken");
					} else {
						createClient(username, password, email, done);
					}
				});
			});
		}
	));
//////////////////////////////////////////////////////////////////////////////////////TODO
	passport.use('login', new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, done) {
			User.findOne({ 'username': username }, function(err, user) {
				// if any errors
				if (err) return done(err);
				// if the user is not found
				if (!user) return done(null, false, req.flash('loginMessage', 'user not found!'));
				// if the password is wrong
				if (!user.validPassword(password))
					return done(null, false, req.flash('loginMessage', 'The password is wrong!'));
				// login successful
				done(null, user);
			});
		}
	));

	createUser = function(username, name, password, callback) {
		initCounter(function() {
			getNextSequence("userid", function(counter) {
				var newUser = new User();
				newUser._id = counter.seq;
				newUser.username = username;
				newUser.name = name;
				newUser.password = newUser.generateHash(password);
				
				// save user
				newUser.save(function(err) {
					if (err) throw err;
					return callback(null, newUser);
				});
			});
		});
	}

	createClient = function(username, password, email, callback) {
		initCounter(function() {
			getNextSequence("userid", function(counter) {
				var newClient = new Client();
				newClient._id = counter.seq;
				newClient.username = username;
				newClient.password = newUser.generateHash(password);
				newClient.email = email;


				// save user
				newUser.save(function(err) {
					if (err) throw err;
					return callback(null, newUser);
				});
			});
		});
	}

	// if the counter is not exist, we will create a counter
	initCounter = function(callback) {
		Counter.findOne({'_id': 'userid'}, function(err, done) {
			if (err) throw err;
			if (!done) {
				var counter = new Counter();
				counter._id = "userid";
				counter.seq = 0;
				counter.save(function(err) {
					if (err) throw err;
					callback();
				});
			} else {
				callback();
			}
		});
	},

	getNextSequence = function(name, callback) {
		Counter.findOneAndUpdate(
			{ _id: name },
			{ $inc: { seq: 1 } },
			{ new: true, upsert: true },
			function(err, done) {
				if (err) throw err;
				if (done) {
					callback(done);
				}
			}
		);
	}
};