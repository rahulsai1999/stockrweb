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
var companydata = require('./public/csvjson.json')
var _=require("lodash");
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
var locat,exx,url,urlx="";
var url1="https://api.iextrading.com/1.0/stock/"
var url2="/batch?types=company,delayed-quote";
var url3="https://newsapi.org/v2/top-headlines?sources=financial-times&apiKey=a0e21d414ee443c79dbd5e0e3cc16bf6";
var url4="https://stocknewsapi.com/api/v1?tickers=";
var url5="&items=10&fallback=true&token=3s0ea5m8ge1ctaanxshdfcevwcp8nvdiybp4szbt";
var url6="https://mlapi83.herokuapp.com/stockpr/";
var url7="https://mlapi83.herokuapp.com/nlp/";
var script1="<script type='text/javascript'> google.charts.load('current', {'packages':['corechart']});google.charts.setOnLoadCallback(drawChart);function drawChart () {$.ajax({url: 'https://api.iextrading.com/1.0/stock/";
var script2="/chart/1y',dataType: 'json',success: function (jsonData) {var data = new google.visualization.DataTable();data.addColumn('string', 'label');data.addColumn('number', 'low');data.addColumn('number', 'open');data.addColumn('number', 'close');data.addColumn('number', 'high');for (var i = 0; i < jsonData.length; i++) {data.addRow([jsonData[i].label, jsonData[i].low,jsonData[i].open,jsonData[i].close,jsonData[i].high]);}var options = {legend: 'none',backgroundColor:'white',bar: { groupWidth: '50%' },candlestick: {fallingColor: { strokeWidth: 0, fill: '#a52714' }, risingColor: { strokeWidth: 0, fill: '#0f9d58' }}};var chart = new google.visualization.CandlestickChart(document.getElementById('chart_div'));chart.draw(data, options);}});}</script>"

var parsedData={};
var moredata={};

app.locals.renderScriptT= function(ticker){return script1+ticker+script2;}

//rest routes
app.get("/",function(req,res){
    if(curu)
    res.redirect("/main")
    else{
    res.render("1home");
    }
});

app.get("/main",isLoggedIn,function(req,res){
    request(url3,function(error,response,body){
        parsedData=JSON.parse(body);
        res.render("2user",{data:parsedData.articles});
    });
});

app.get("/about",function(req,res){
    res.render("8about");
});

app.get("/tutorials",isLoggedIn,function(req,res){
    res.render("7tutorial");
});

app.get("/stockview/:ticker",isLoggedIn,function(req,res){
    var ticker=req.params.ticker;
    url=url1+ticker+url2;
    urlx=url4+ticker+url5;
    urly=url6+ticker;
    urlz=url7+ticker;
    request(url,function(error,response,body){
        parsedData=JSON.parse(body);
        request(urlx,function(error,response,body){
            moredata=JSON.parse(body);
            request(urly,function(error,response,body){
                preddata=JSON.parse(body);
                request(urlz,function(error,response,body){
                    nlpdata=JSON.parse(body);
                    res.render("6stockview",{ticker:ticker,companydata:parsedData,moredata:moredata.data,preddata:preddata,nlpdata:nlpdata});
                });
            });
        });
    });
});

app.post("/searchstock",function(req,res){
    var se=_.startCase(req.body.query);
    var founddata=[];
    for(var i=0;i<companydata.length;++i)
    {
        if(companydata[i]["Name"].includes(se)){
            founddata.push(companydata[i]);
        }
    }
    res.render("10search",{found:founddata});
});

app.get("/addstock/:ticker",isLoggedIn,function(req,res){
    var ticker=req.params.ticker;
    console.log(req.user.id);
    User.findOne({_id:req.user.id},function(err,founduser){
        if(err)
        console.log(err);
        else{
            founduser.stocks.push(ticker);
            User.findOneAndUpdate({_id:req.user.id},founduser,function(err,usern){
                if(err)
                console.log(err);
                else
                {
                    console.log(usern);
                    res.redirect("/main");
                }    
            });
        }
    });
});

app.get("/delstock/:ticker",isLoggedIn,function(req,res){
    var ticker=req.params.ticker;
    console.log(req.user.id);
    User.findOne({_id:req.user.id},function(err,founduser){
        if(err)
        console.log(err);
        else{
            founduser.stocks = founduser.stocks.filter(function(item) { 
                return item !== ticker
            })
            User.findOneAndUpdate({_id:req.user.id},founduser,function(err,usern){
                if(err)
                console.log(err);
                else
                {
                    console.log(usern);
                    res.redirect("/main");
                }    
            });
        }
    });
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
