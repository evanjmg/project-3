var User              = require('../models/user');
var passport 					= require('passport');
var LocalStrategy   	= require('passport-local').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy




// ============ PASSPORT SESSION SETUP

module.exports = function(passport){

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(id, callback) {
		User.findById(id, function(err, user) {
			callback(err, user);
		});
	});

// ============ LOCAL SIGNUP

passport.use('local-signup', new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true
}, function(req, email, password, callback) {
  process.nextTick(function() {

    // Find a user with this e-mail
    User.findOne({ 'local.email' :  email }, function(err, user) {
      if (err) return callback(err);

      // If there already is a user with this email 
      if (user) {
        return callback(null, false);
      } else {
      // There is no email registered with this email

        // Create a new user
        var newUser            = new User();
        newUser.local.email    = email;
        newUser.local.password = newUser.encrypt(password);

        newUser.save(function(err) {
          if (err) throw err;
          return callback(null, newUser);
        });
      }
    });
  });
}));


// ============ LOCAL LOGIN 

passport.use('local-login', new LocalStrategy({
	usernameField : 'email',
	passwordField : 'password',
	passReqToCallback : true
}, function(req, email, password, callback) {
	process.nextTick(function() {

		User.findOne({ 'local.email' :  email }, function(err, user){
			if (err) 
				return callback(err);
			if (!user) {
				return callback(null, false);
			}       
    if (!user.validPassword(password)) return callback(null, false); 
    return callback(null, user);
		});

	})
})
);

  // ============ LINKEDIN LOGIN 

  passport.use('linkedin', new LinkedInStrategy({
  	clientID: process.env.LINKEDIN_API_KEY,
  	clientSecret: process.env.LINKEDIN_SECRET_KEY,
  	callbackURL: "http://localhost:8000/api/users/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_basicprofile'],
    state: true
  	// profileFields   : ['id','emails', 'location', 'industry']
  }, 

  function(token, tokenSecret, profile, done) {
  	console.log(profile);
  	process.nextTick(function() {
  	}), 

  	User.findOne({ 'local.email' : profile.emails[0].value }, 
      function(err, user) {
  		if (err) return done(err);
      console.log('error' + profile)
  		if (user) {
  			return done(null, user);
        console.log('user' + profile)
  		} else {
        console.log('new user saved' + profile);
  			var newUser = new User();
  			newUser.linkedin.access_token 	= token;

  			newUser.local.name   				    = profile.displayName
        newUser.linkedin.location       = profile._json.location.name;
  			newUser.linkedin.url		        = profile._json.publicProfileUrl;
  			newUser.linkedin.industry				= profile._json.industry;
  			newUser.linkedin.avatar 				= profile._json.pictureUrl;
  			newUser.local.email 						= profile.emails[0].value;


  			newUser.save(function(err) {
  				console.log('saved!')
  				if (err) throw err;
  				return done(null, newUser);
  			});
  		}
  	});
  }));

// exports.isAuthenticated = function(req, res, next) {
// 	if (req.isAuthenticated()) return next();
// 	res.redirect('/login');
// };
}


