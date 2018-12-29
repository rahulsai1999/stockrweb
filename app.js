var express=require("express");
var http=require("http");
var Review = require("./models/review");
var User = require("./models/user");
var Book = require("./models/book");
var Movie = require("./models/movie");
var mongoose = require("mongoose");
var request=require("request");
var bodyParser=require("body-parser");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var app=express();

mongoose.connect("mongodb://localhost:27017/bookrev_sample",{ useNewUrlParser: true });
//mongoose.connect("mongodb://admin:admin83@ds151012.mlab.com:51012/revcentral");

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

//login and signup module
app.use(express.static("loginmod"));
app.use(express.static("loginmod/css"));
app.use(express.static("loginmod/fonts"));
app.use(express.static("loginmod/images"));
app.use(express.static("loginmod/js"));
app.use(express.static("loginmod/vendor"));

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
    res.render("home");
    }
});

app.get("/main",isLoggedIn,function(req,res){
    res.render("main");
});

app.get("/select",isLoggedIn,function(req,res){
   res.render("select"); 
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

app.get("/books/:id",function(req,res){
    var id=req.params.id;
    Book.findById(id).populate("reviews").exec(function(err, book){
        if(err)
            console.log(err);
        else 
        {
            res.render("bookview",{data:book});
        }
      });
});

app.get("/movies/:id",function(req,res){
    var id=req.params.id;
    Movie.findById(id).populate("reviews").exec(function(err, movie){
        if(err)
            console.log(err);
        else 
        {
            res.render("movieview",{data:movie});
        }
      });
});

app.get("/reviews/:id",function(req,res){
    var id=req.params.id;
    Review.findById(id,function(err,review){
        if(err)
        console.log(err);
        else
        res.render("review",{data:review});
    });
});

app.get("/rev/:id/edit",isLoggedIn,function(req,res){
    Review.findById(req.params.id,function(err,review){
        if(err){
            console.log(err);
        } else{
            res.render("edit",{data:review});
        }
    });
});

app.put("/rev/:id",function(req,res){
    //change this body shit 
    Review.findByIdAndUpdate(req.params.id,req.body.block,function(err,updated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/books");
            console.log("Book successfully Updated");
        }
    });
});

app.get("/rev/:id/delete",function(req,res){
    Review.findByIdAndRemove(req.params.id,function(err,deleted){
        if(err){
            console.log(err);
        }     
        else{
            res.redirect("/myreviews");
            console.log("Review successfully deleted");
        }
    });
});

app.get("/myreviews",function(req,res){
    Review.find({author:curu.username},function(err,found){
        if(err)
        console.log(err);
        else
        res.render("myreviews",{data:found});
    });
});

//book selection and review

//step 1
app.get("/searchb",isLoggedIn,function(req,res){
    res.render("search");
});
//step 2
app.post("/searchb",function(req,res){
    locat=req.body.locat;
    locat=locat.trim();
    var arr=locat.split(" ");
    exx=arr.join("+");
    url=url1+exx;
    console.log(url);
    request(url,function(error,response,body)
    {
        parsedData=JSON.parse(body);
        res.render("result",{data:parsedData});
    });
});
//step 3
app.get("/selectb/:isb",function(req,res){
    exx=req.params.isb;
    url=url2+exx;
    request(url,function(error,response,body){
        parsedData=JSON.parse(body);
        res.render("write",{data:parsedData});
    });
});

//final step (post request)
app.post("/finalb",function(req, res){
   var review= new Review({
    author:curu.username,
    title:req.body.title,
    content:req.body.content,
    rating:req.body.rating,
    type:"book",
    date:new Date().toLocaleDateString()
});
   Review.create(review, function(err, newrev){
        if(err){
            res.redirect("/searchb");
        } 
        else 
        {
            var book = new Book({
                title:parsedData.items[0].volumeInfo.title,
                author:parsedData.items[0].volumeInfo.authors[0],
                publishedDate:parsedData.items[0].volumeInfo.publishedDate,
                genre:parsedData.items[0].volumeInfo.categories[0],
                isbn:parsedData.items[0].volumeInfo.industryIdentifiers[0].identifier,
                imageUrl:parsedData.items[0].volumeInfo.imageLinks.thumbnail,
                avg_rating:parsedData.items[0].volumeInfo.averageRating,
                reviews:[]
            });

            Book.findOne({isbn:parsedData.items[0].volumeInfo.industryIdentifiers[0].identifier},function(err,foundb){
                if(err)
                console.log(err);
                else
                {
                    if(!!foundb){
                    foundb.reviews.push(newrev);
                    Book.findByIdAndUpdate(foundb.id,foundb,function(err,fin){
                        if(err)
                        console.log(err);
                        else
                        console.log(fin);
                    });
                    }
                    else
                    {
                        book.reviews.push(newrev);
                        Book.create(book,function(err,newb){
                        if(err)
                        console.log(err);
                        else
                        console.log(newb);
                    });
                    }
                }
            });
            
            //then, redirect to the index
            res.redirect("/main");
        }
    }); 
});


//movie selection and review

//step 1
app.get("/searchm",isLoggedIn,function(req,res){
    res.render("searchm");
});

//step 2
app.post("/searchm",function(req,res){
    locat=req.body.locat;
    locat=locat.trim();
    var arr=locat.split(" ");
    exx=arr.join("+");
    url=url3+exx;
    console.log(url);
    request(url,function(error,response,body)
    {
        parsedData=JSON.parse(body);
        res.render("resultm",{data:parsedData});
    });
});

//step 3
app.get("/selectm/:imdb",function(req,res){
    exx=req.params.imdb;
    url=url4+exx;
    request(url,function(error,response,body){
        parsedData=JSON.parse(body);
        res.render("writem",{data:parsedData});
    });
});

//final step
app.post("/finalm",function(req, res){
    var review= new Review({
        author:curu.username,
        title:req.body.title,
        content:req.body.content,
        rating:req.body.rating,
        type:"movie",
        date:new Date().toLocaleDateString()
    });
    Review.create(review, function(err, newrev){
        if(err){
            res.redirect("/searchm");
        } 
        else 
        {
            var movie = new Movie({
                title:parsedData.Title,
                Year:parsedData.Year,
                genre:parsedData.Genre,
                imdb:parsedData.imdbID,
                imageUrl:parsedData.Poster,
                avg_rating:parsedData.imdbRating,
                reviews:[]
            });

            Movie.findOne({imdb:parsedData.imdbID},function(err,foundm){
                if(err)
                console.log(err);
                else
                {
                    if(!!foundm){
                    foundm.reviews.push(newrev);
                    Movie.findByIdAndUpdate(foundm.id,foundm,function(err,fin){
                        if(err)
                        console.log(err);
                        else
                        console.log(fin);
                    });
                    }
                    else
                    {
                        movie.reviews.push(newrev);
                        Movie.create(movie,function(err,newm){
                        if(err)
                        console.log(err);
                        else
                        console.log(newm);
                    });
                    }
                }
            });
            
            //then, redirect to the index
            res.redirect("/main");
        }
    });
    
});



//auth
app.get("/login",function(req,res){
    res.render("login");
});

app.get("/signup",function(req,res){
    res.render("signup")
})

app.post("/register",function(req,res){
    User.register(new User(
    {username:req.body.username,
        email:req.body.emaill,
        DOB:req.body.birthday
    }),
    req.body.password,
        function(err,user){
            if(err)
            {
                console.log(err);
                alert("Username already taken or Password not valid")
                res.render("signup");
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

var port = 3000;//process.env.PORT;//3000;
  app.set('port', port);

server.listen(port);
