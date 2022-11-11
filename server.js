const app = require('express')();
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
require("dotenv").config()
const path = require('path');
const axios=require('axios')
//adding google authentication
const GoogleStrategy = require("passport-google-oauth2").Strategy

const Google = require("./model/user");

//passport is used for authenticating the request
const passport = require("passport");

var user = null;
var accessToken=null;

const session = require('express-session');


app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET
}));

// passport.initialize assigns _passport object to request object, checks if there's a session object
// req._passport.session = req.session['passport']
app.use(passport.initialize());

// passport.session looks for user field in req._passport.session, and if finds one, passes it to deserializeUser function and calls it. deserializeUser function assigns req._passport.session.user to user field of request object (if find one in req._passport.session.user). This is why, if we set user object in serializeUser
app.use(passport.session());

//passport authenticate the session
app.use(passport.authenticate('session'));
// serializeUser function to persist user data (after successful authentication) into session.
passport.serializeUser(function (user, cb) {
    cb(null, user);
});

//deserializeUser is used to retrieve user data from session.
passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});
// The client ID and secret obtained when creating an application are supplied as options when creating the strategy. 
// The strategy also requires a verify callback, which receives the access token and optional refresh token, as well as profile which contains the authenticated user's Google profile. 
// The verify callback must call cb providing a user to complete authentication
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        try {
            let existingUser = await Google.findOne({ 'id': profile.id });
            // if user exists return the user 
            accessToken=accessToken
            if (existingUser) {
                console.log(existingUser,"user-----------")
                user = existingUser;
                return done(null, existingUser);
            }
            // if user does not exist create a new user 
            const newUser = new Google({
                id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                refreshToken: refreshToken
            });
            user = await newUser.save();
            console.log(user)
            return done(null, newUser);
        } catch (error) {
            return done(error, false)
        }
    }
));
// 1//046RxJ-z7f7z0CgYIARAAGAQSNwF-L9Ir6Kz1y3RvB9OS2CSqFSJ0ENdPy-o6h9biwypuPw1QRJ1mkwIZVyCWL0LXiwgeQrPEjtI
//setup for rendering ejs in browser
app.set('view engine', 'ejs');
var config = {
    method: 'get',
    url: `https://www.googleapis.com/auth/analytics?access_token=${accessToken}`,
    headers: {}
  };
  axios(config)
    .then(function (response) {
        console.log(response)
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error.message);
    });
// console.log(result)
//login page
app.get('/', function (req, res) {
    res.render('pages/auth');
});

//when user logout 
app.get('/logout', function (req, res, next) {
    Google.findByIdAndRemove(user._id)
        .then(() => {
            req.logout(function (err) {
                if (err) { return next(err); }
                res.redirect('https://accounts.google.com/logout');
            });
        })

});

//success route 
app.get('/success', (req, res) => res.render('pages/success', { user }))
app.get('/error', (req, res) => res.send("error logging in"));

//google strategy is used to authenticate and define scope 
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['https://mail.google.com/', 'https://www.googleapis.com/auth/userinfo.profile'],
        accessType: 'offline',
        prompt: 'consent',
    }))

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function (req, res) {
        // Successful authentication, redirect success.
        console.log('Helooo auth/google/callback')
        res.redirect('/success');
    });

//error handling middleware
app.use((error, req, res, next) => {
    console.log(error.message);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});

//set up for mongoose
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("connect", process.env.PORT);
        app.listen(PORT, () => {
            console.log(`Server is listening on PORT`);
        })
    })
    .catch((err) => {
        console.log(err);
    });
