require('dotenv').config()
const config = require('./config');
const fs = require('fs');
const express = require('express')
const session = require('express-session');
const app = express();
const passport = require('passport')

const AtlassianOAuthStrategy = require('passport-atlassian-oauth').Strategy

const privateKeyData = fs.readFileSync(config["consumerPrivateKeyFile"], "utf8");
const consumerKey    = config["consumerKey"]
const jiraUrl        = config["jiraUrl"]


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new AtlassianOAuthStrategy({
    applicationURL: jiraUrl,
    callbackURL:"http://localhost:3005/auth/atlassian-oauth/callback",
    consumerKey: consumerKey,
    consumerSecret: privateKeyData
},
    function (token, tokenSecret, profile, done) {
        process.nextTick(function () {
            // return user's Atlassian profile
            return done(null, profile);
        });
   } 
));

// configure Express

app.set('port', process.env.PORT || 3005);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(session({
    secret: 'ssshhhh!',
    resave: false,
    saveUninitialized: true,
    //cookie: {secure: false}
}));
      
app.use((req, res, next) => {
    res.session = req.session;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
//app.use(express.static(__dirname + '/public'));


//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Atlassian authentication will involve
//   redirecting the user to the atlassian Oauth authorisation page.  
//   After authorization, the Atlassian app will
//   redirect the user back to this application at /auth/atlassian-oauth
app.get('/auth/atlassian-oauth',
    passport.authenticate('atlassian-oauth'),
    function (req, res) {
        // The request will be redirected to the Atlassian app for authentication, 
        // so this function will not be called.
    });

//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/atlassian-oauth/callback',
    passport.authenticate('atlassian-oauth', { failureRedirect:'/login' }),
    function (req, res) {
        res.redirect('/');
    });

//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}

app.get('/', function (req, res) {
    res.render('index', { user:req.user });
});

app.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account', { user:req.user });
});

app.get('/login', function (req, res) {
    res.render('login', { user:req.user });
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(parseInt(process.env.PORT || 3005));
