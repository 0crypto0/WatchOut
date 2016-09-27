var mongoose = require('mongoose');
var _ = require('underscore');
var Online = require('./../app/models/online');
var async = require('async');
var dateFormat = require('dateformat');
var Client = require('./models/client');
var SuspeciousWord = require('./models/suspeciouswords');
var Suspect = require('./models/suspects');
var Message = require('./../app/models/message');
var Filter = require('bad-words'),
 filter = new Filter();

var sessionTime = 10000; // 10 seconds

var usersOnline = [];

module.exports = function(app, passport, io) {
	
	// home page
	app.get('/', isLoggedIn, function(req, res) {
		res.render('WatchOut-index.ejs', {client: req.client});
	});

	// login page
	app.get('/WatchOut-login', function(req, res) {
		res.render('WatchOut-login.ejs', { message: req.flash('loginMessage') });
	});

	// process login
	app.post('/WatchOut-login', function(req, res, next) {
		passport.authenticate('WatchOut-login', function(err, client, info) {
			if (err) return next(err);
			if (!client) return res.redirect('/WatchOut-login');
			req.logIn(client, function(err) {
				if (err) return next(err);
				var redirect_to = req.session.redirect_to || '/WatchOut-profile';
				return res.redirect(redirect_to);
			});
		})(req, res, next);
	});

	// sign up page
	app.get('/WatchOut-signup', function(req, res) {
		res.render('WatchOut-signup.ejs', { message: req.flash('signupMessage') });
	});

	// process signup
	app.post('/WatchOut-signup', function(req, res, next) {
		passport.authenticate('WatchOut-signup', function(err, client, info) {
			if (err) return next(err);
			if (!client) return res.redirect('/WatchOut-signup');
			req.logIn(client, function(err) {
				if (err) return(next);
				return res.redirect('/WatchOut-profile');
			});
		})(req, res, next);
	});

	// profile page
	app.get('/WatchOut-profile', isLoggedIn, function(req, res) {
		res.render('WatchOut-profile.ejs', { client: req.client });
	});

	// logout
	app.get('/WatchOut-logout', function(req, res) {
		delete req.session.redirect_to;
		req.logout();
		res.redirect('/');	// redirect to home page
	});


	// get all messages from the database
	app.get('/messages', function(req, res, next) {
		Message.find({}).sort('-create_at').exec(function(err, messages) {
			findUserMessage(messages, function(data) {
				res.json({messages: data});
			});
	    });
	});

	// get all the user who is online
	app.get('/clientOnline', function(req, res, next) {
		clientOnline(function(data) {
			res.json(data);
		});
	});

	// update user's status (online or offline)
	io.on('connection', function(socket){
		var client;
		var isOnline = false;
		var timeOutId = 0;

		socket.on("i-am-online", function(data) {
			if (data) {
				clientId = data.userId;
				Client.findById(clientId, function(err, client) {
					if (err) return callback(err);
					if (client) {
						if (!isOnline) {
							var index = clientsOnline.indexOf(client.username);
							if (index <= -1) {
								clientsOnline.push(client.username);
							}
							io.emit("onlines", clientsOnline);
							// isOnline = true;
							// setUserOnline(user);
						}

						if (timeOutId) {
							clearTimeout(timeOutId);
							timeOutId = 0;
						} 

						timeOutId = setTimeout(function() {
							var index = clientsOnline.indexOf(client.username);
							if (index > -1) {
								clientsOnline.splice(index, 1);
							}
							io.emit("onlines", clientsOnline);
							// setUserOffline(user);
							// isOnline = false;
						}, sessionTime);
						console.log("test clientsOnline: "+clientsOnline);
					}
				});
			}
		});
	});

	// make sure user is logged in
	function isLoggedIn(req, res, callback) {
		if (req.isAuthenticated()) return callback();
		req.session.redirect_to = req.originalUrl;
		res.redirect('/WatchOut-login');
	}

	// find users who are online
	function clientsOnline(callback) {
		var clientOnline = [];
		Online.find({}, function(err, data) {
			for (var i in data) {
				if (data[i].isOnline) {
					clientOnline.push(data[i]);
				}
			}
			callback(clientOnline);
		})
	}

	// update user's status and send to all clients
	function setClientStatus(client, isOnline) {
		Online.findOne({'username': client.username}, function(err, data) {
			if (err) throw err;
			if (data) {
				data.isOnline = isOnline;
				data.save();
			} else { //create new user online if the user is not exist
				var newClientOnline = new Online();
				newUserOnline.username = client.username;
				newUserOnline.isOnline = isOnline;
				newUserOnline.save();
			}
			// send all users who is online for clients
			clientOnline(function(data) {
				io.emit("onlines", data);
			});
		});
	}

	// set user is online
	function setClientOnline(client	) {
		setClientStatus(client, true);
	}

	// set user is offline
	function setClientOffline(client) {
		setClientStatus(client, false);
	}

};