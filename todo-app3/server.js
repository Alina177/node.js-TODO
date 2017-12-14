/*
@author Alina Gritsay
@file This is simple JS file with TODO app
@version 1.0.0
@copyright Alina Gritsay 2017
*/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Mongoose = require('mongoose').Mongoose; // Mongoose import
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var port  =   process.env.PORT || 7777;

var mongoosetodo = new Mongoose();
mongoosetodo.connect(config.databasetodo);

var mongooseuser = new Mongoose();
mongooseuser.connect(config.databaseuser);

app.set('superSecret', config.secret); // secret variable
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.urlencoded({'extended':'true'}));

var SchemaTodo = mongoosetodo.Schema;
var SchemaUser = mongooseuser.Schema;

var TodoSchema = new SchemaTodo({
    text: String,
    _user: {type: mongooseuser.Schema.Types.ObjectId, ref: 'User'}
});

var UserSchema = new SchemaUser({
    name: {type: String, unique: true},
    password: String,
    admin: Boolean
});

var Todo = mongoosetodo.model('Todo', TodoSchema);
var User = mongooseuser.model('User', UserSchema);

app.get('/signup', function (req,res) {
    res.sendfile('./public/registration.html');
});

var registrationRoutes = express.Router();
registrationRoutes.use('/',function (req,res,next) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;
        if(user){
            res.status(500).send({success: false, message:'Registration failed. User already consist.'});
        }else{
            next();
        }
    });
});
registrationRoutes.use('/',function (req,res,next) {
    var password = req.body.password;
    var username = req.body.name;
    if ( (username !== undefined && username !== '' ) && (password !== undefined && password !== '')  ) {
        var Preg =/^([a-z]|\d|_)+$/i;
        if( Preg.test(password) === true && Preg.test(username) === true) {
            next();
            //res.json({success: false, message:'Your registration success'});
        }else {
            password = undefined;
            username = undefined;
            console.log('space problem');
            res.json({success: false, message:'Please check your data for spaces'});
        }
    }else if (  username === undefined && password !== undefined ) {
        console.log('username do not consist');
        res.json({success: false, message:'Enter user name'});
    }else if( password === undefined && username !== undefined){
        res.json({success: false, message:'Enter user password'});
    }else{
        res.json({success: false, message:'Enter the correct data. Please check your data for spaces'});
    }
});
registrationRoutes.post('/', function (req,res,next) {
    User.create({
        name: req.body.name,
        password: req.body.password
    }, function (err,data) {
        if(err) next(new Error('Problems with creating user in DB'));
        res.json({
            success: true,
            message:'Your registration success. User was created'
        });
    });
});
registrationRoutes.use('/',function (err,req,res) {
    res.json({message: err.message});
});
app.use('/registration', registrationRoutes);

app.get('/login', function (req,res) {
    res.sendfile('./public/auth.html');
});

var authRoutes = express.Router();
authRoutes.use('/',function (req,res,next) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            console.log('user not found');
            res.status(500).send({success: false, message: 'Authentication failed. User not found.'});
        } else if (user) {
            // check if password matches
            req.user = user;
            next();
        }
    });
});
authRoutes.use('/', function (req,res,next) {
    if (req.user.password != req.body.password) {
        res.status(500).send({success: false, message: 'Authentication failed. Wrong password.'});
    } else {
        console.log("server: password is checked " +  req.body.password);
        // if user is found and password is right   // create a token
        req.user.password =  "";
        var token = jwt.sign(req.user, app.get('superSecret'), {
            expiresIn: 86400 // expires in 24 hours
        });
        req.body.token = token;
        next();
    }
});
authRoutes.use('/', function (req,res) {
    var token = req.body.token;
    res.json({
        success: true,
        token: token
    });
});
app.use('/auth', authRoutes);

var isAuthorize =  function(req,res,next) {
    //console.log('isAuth');
    var token = getToken(req);
    console.log('/use get token ' + token);
    if (token) {
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                req.decoded = decoded;
                var token = getToken(req);
                var decodedUser = jwt.decode(token, {complete: true});
                req.decodedUser = decodedUser;
                // console.log('we can create user token for ' + decodedUser.payload._doc.name);
                User.findOne({
                    _id: decodedUser.payload._doc._id
                }, function(err, user) {
                    if (err) throw err;
                    if (!user) {
                        res.status(500).send({success: false, message: 'User not found.'});
                    } else if (user) {
                        next();
                    }
                });
            }
        });
    }else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
}

app.use(isAuthorize);

app.get('/todos',function (req,res) {
    res.sendfile('./public/index.html');
});
app.get('/todos/load',function (req,res) {
    Todo.find({_user: req.decodedUser.payload._doc._id},function (err, todos) {
        if (err) res.send(err);
        console.log("find todos");
        res.json(todos);
    });
});


var appRoutes = express.Router();
appRoutes.get('/',function (req,res,next) {
    if( (req.body.text !== undefined)  ){
        next();
    }else{
        Todo.find({_user: req.decodedUser.payload._doc._id},function (err, todos) {
            if (err) res.send(err);
            res.json(todos);
        });
    }
});
appRoutes.post('/',function (req,res,next) {
    var token = getToken(req);
    var decodedUser = jwt.decode(token, {complete: true});
    Todo.create({
        text: req.body.text,
        _user: decodedUser.payload._doc._id
    }, function (err, todo) {
        if (err) next(new Error('Error with creating todo in DB'))
        Todo.find({_user: decodedUser.payload._doc._id},function (err, todos) {
            if (err) res.send(err);
            res.json(todos);
        });
    });
});
appRoutes.delete('/:todo_id/', function (req,res) {
    var token = getToken(req);
    var id = req.param('id');
    var decodedUser =  req.decodedUser;
    // !!!! find if user consist
    if(token) {
        User.findOne({
            _id: decodedUser.payload._doc._id
        }, function (err, user) {
            if (err) throw err;
            if (!user) {
                res.redirect('/login');
            } else if (user) {
                Todo.remove({
                    _id: id
                }, function (err, todo) {
                    if (err) res.send(err);
                    Todo.find({_user: decodedUser.payload._doc._id},function (err, todos) {
                        if (err) res.send(err);
                        res.json(todos);
                    });
                });
            }
        });
    }
    else{
        res.redirect('/login');
    }
});
appRoutes.put('/:todo_id/', function (req,res) {
    var isUpdate = req.param('isUpdate');
    var token = getToken(req);
    var id = req.param('id');
    var text = req.param('text');
        var decodedUser =  req.decodedUser;
        if (isUpdate == true) {
            var result;
            Todo.findByIdAndUpdate(id, {$set: {text: text}}, function (err, response) {
                console.log('find and update');
                Todo.find({_user: decodedUser.payload._doc._id}, function (error, todos) {
                    if (error) res.send(error);
                    result = todos;
                    console.log('c' + result);
                    res.json(result);
                });
            });
        } else {
            // !!!! find if user consist
            if (token) {
                // console.log('req params ' + req.params.todo_id); var id = req.params.todo_id; console.log('id' + id.length); var newId = id.substring(0,id.length-1); console.log('new id ' + newId.length + ' ' + newId);
                // var str = '59a66fef86d4125c16000001'; console.log(str == req.params.todo_id);  console.log('str ' + str.length + ' ' + str);
                Todo.findById(id, function (err, todos) {
                    if (err) res.send(err);
                    //console.log(todos.text);
                    res.json(todos);
                });
            } else {
                res.redirect('/login');
            }
        }
});
appRoutes.use('/',function(err,req,res){
    console.log('hi');
    // res.json({message: err.message});
});
app.use('/app',appRoutes);

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 — Error on the server');
    next();
});

app.use(function(req, res){
    res.type('text/plain');
    res.status(404);
    res.send('404 — Page not found');
});

app.listen(port);
console.log('Listening on port ' + port);

function getToken(req){
    return req.body.token || req.param('token') || req.headers['x-access-token'];
}

/*
1. race condition / async problem inside DELETE and PUT endpointsОт:Al Your Pal
2. DELETE and PUT currently allow "Al" to delete/change "Max"s data От:Al Your Pal
3. GET code is inside a router.use() instead of inside a router.get()От:Al Your Pal
4. get the app working again  without hacks!  The "network" tab should be your best best best good friend
*/