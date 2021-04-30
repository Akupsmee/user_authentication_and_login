//jshint esversion:6
require("dotenv").config()
const dotenv = require("dotenv");

const express = require("express")
const app = express()
const mongoose = require("mongoose")

const session = require("express-session")
const passportLocalMongoose = require("passport-local-mongoose")
const passport = require("passport")
// const localPassport = require("passport-local")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const findOrCreate = require("mongoose-findorcreate")


app.set("view engine", "ejs")
app.use(express.urlencoded({
    extended: true
}))
app.use(express.static("public"))

// ! express session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}))

// ! passport
app.use(passport.initialize())
app.use(passport.session())

// ! connect mongoose database
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})

// ! passportLocalMongoose & findOrCreate plugin
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("User", userSchema)


//  ! passportlocal
passport.use(User.createStrategy());

//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            facebookId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));



app.get("/", (req, res) => {
    res.render("home")
})


app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile"]
    })
)

app.get("/auth/google/secrets",
    passport.authenticate("google", {
        failureRedirect: "/login"
    }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    });



app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });


app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/logout", (req, res) => {
    req.logOut()
    res.redirect("/")
})

app.get("/secrets", (req, res) => {

    // if(req.isAuthenticated()){
    //     res.render("secrets")
    // }else{
    //     res.redirect("/login")
    // }
    User.find({
        "secret": {
            $ne: null
        }
    }, (err, foundUsers) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {
                    usersWithSecrets: foundUsers
                })
            }
        }
    })
})

app.get("/submit", (req, res) => {

    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

app.post("/submit", (req, res) => {
    const {
        secret
    } = req.body


    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = secret
                foundUser.save(() => {
                    res.redirect("/secrets")
                })
            }
        }
    })
})

app.post("/register", (req, res) => {
    const {
        username,
        password
    } = req.body

    User.register({
        username: username
    }, password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })

        }

    })


})



app.post("/login", (req, res) => {
    const {
        username,
        password
    } = req.body

    const user = new User({
        username: username,
        password: password
    })

    req.logIn(user, err => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }

    })
})







app.listen(3000, (req, res) => {
    console.log("app is been served on port 3000");
})



function fibonacciGenerator (n) {
    var output = [];
    for(var i=1;i<n;i++){
      if(i===0){
          output = [0] ;
          console.log(output); 
      }
      else if(i===1){
          output = [0] ;
          console.log(output); 
      }
      else if (i===2){
          output=[0,1] ;
        }
        output.push(output[i-1]+output[i-2])    ;    
    }
      console.log(output);
      
    }
    fibonacciGenerator(2);