var express = require("express");
var app= express();

var formidable = require("express-formidable");
app.use(formidable());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectID;

var http = require("http").createServer(app);
var bcrypt = require("bcrypt");
var fileSystem = require("fs");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret1234567890";

app.use("/public",express.static(__dirname+"/public"));
app.set("view engine","ejs");

var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", function (socket) {
	console.log("User connected", socket.id);
	socketID = socket.id;
});

http.listen(3000,function(){
    console.log("Server started at port 3000");

    mongoClient.connect('mongodb+srv://user1:Qwerty123@cluster0.ws1pj.mongodb.net/foodDb?retryWrites=true&w=majority',function(error,client){
        var database = client.db("social_media_network");
        console.log("Database connected");

        app.get("/signup",function(request, result){
            result.render("signup");
        });

        app.post("/signup", function(request, result){
            var username = request.fields.username;
            var password = request.fields.password;

            database.collection("users").findOne({"username": username},function(error, user){
                if(user == null){
                    bcrypt.hash(password, 10, function (error, hash) {
                        database.collection("users").insertOne({
                            "username": username,
                            "password":hash
                        },function(error, data){ 
                            result.json({
                                "status": "success",
                                "message": "Sigup successful."
                            });
                        });
                    });
                }
                else{
                    result.json({
                        "status":"error",
                        "message": "username already exist"
                    });
                }
            });
        });
        app.get("/login",function(request, result){
            result.render("login");
        });

        app.post("/login", function(request, result){
            var username = request.fields.username;
            var password = request.fields.password;
            database.collection("users").findOne({"username": username},function(error, user){
                if(user == null){
                    result.json({
						"status": "error",
						"message": "Email does not exist"
                    });
                } else {
					bcrypt.compare(password, user.password, function (error, isVerify) {
						if (isVerify) {
							var accessToken = jwt.sign({ username: username }, accessTokenSecret);
							database.collection("users").findOneAndUpdate({
								"username": username
							}, {
								$set: {
									"accessToken": accessToken
								}
							}, function (error, data) {
								result.json({
									"status": "success",
									"message": "Login successfully",
                                    "accessToken": accessToken	
								});
							});
						} else {
							result.json({
								"status": "error",
								"message": "Password is not correct"
							});
						}
					});
				}
			});
        });
    });
});        
