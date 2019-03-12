var express=require("express");
var http=require("http");
var User = require("./models/user");
var mongoose = require("mongoose");
var request=require("request");
var bodyParser=require("body-parser");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var app=express();

mongoose.connect("mongodb://localhost:27017/stockrtest",{ useNewUrlParser: true });

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

//auth requirements
app.use(require("express-session")({
   secret:"bookrev",
   resave:false,
   saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var curu={};

app.use(function(req,res,next){
  curu=req.user;
  res.locals.currentUser = req.user;
  next();
})

//---------------------------------------------------------------//
var locat,exx,url="";
var url1="https://www.googleapis.com/books/v1/volumes?q=";
var url2="https://www.googleapis.com/books/v1/volumes?q=isbn:";
var url3="http://www.omdbapi.com/?apikey=thewdb&s=";
var url4="http://www.omdbapi.com/?apikey=thewdb&i=";

var parsedData={};


//rest routes
app.get("/",function(req,res){
    if(curu)
    res.redirect("/main")
    else{
    res.render("1home");
    }
});

app.get("/main",isLoggedIn,function(req,res){
    res.render("2user");
});

app.get("/about",function(req,res){
    res.render("8about");
});

app.get("/tutorials",isLoggedIn,function(req,res){
    res.render("7tutorial");
});


app.get("/books",function(req,res){
    Book.find({}).populate("reviews").exec(function(err,book){
        if(err)
        console.log(err);
        else
        {
            res.render("books",{data:book});
        }
    });
});

app.get("/movies",function(req,res){
    Movie.find({}).populate("reviews").exec(function(err,movie){
        if(err)
        console.log(err);
        else
        {
            res.render("movies",{data:movie});
        }
    });
});


//auth
app.get("/login",function(req,res){
    res.render("3login");
});

app.get("/register",function(req,res){
    res.render("4register")
})

app.post("/register",function(req,res){
    User.register(new User(
    {   
    username:req.body.username,
    email:req.body.email,
    DOB:req.body.dob,
    name:req.body.name
    }),
    req.body.password,
        function(err,user){
            if(err)
            {
                console.log(err);
                alert("Username already taken or Password not valid")
                res.render("4register");
            }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/login");
        });
    });
});

app.post("/login",passport.authenticate("local",{
    failureRedirect:"/login"}),
    function(req,res){
        res.redirect("/main");
    });

app.get("/logout", function(req, res){
    req.logout();
    userr="";
    res.redirect("/");
});  

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//trash
app.get("*",function(req,res){
    res.render("error");
});



//server
var server = http.createServer(app);

var port = 3000;//process.env.PORT;
app.set('port', port);
server.listen(port,function(err,suc){
    if(!err)
    console.log("Server started");
});
