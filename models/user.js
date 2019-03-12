var mongoose = require("mongoose");
var passportLocalMongo=require("passport-local-mongoose");
var userSchema = new mongoose.Schema({
    email: String,
    name:String,
    username: String,
    password:String,
    DOB:String,
    stocks:Array
});
userSchema.plugin(passportLocalMongo);
module.exports = mongoose.model("User", userSchema);