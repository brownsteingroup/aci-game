const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { networkInterfaces } = require('os');
const dotenv = require('dotenv');

//Server setup
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { wsEngine: 'ws' });

dotenv.config();

//Get server IP to make websocket connection
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}
const myAddress = results[Object.keys(results)[0]];
console.log(myAddress);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//Pathing for static resources
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(function(req, res, next){
  res.io = io;
  next();
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Unique ID to match
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var myID = '';

//Main routes
app.get('/', function(req, res, next) {
  myID = getRandomInt(10000,99999);
  res.render('index', { title: 'ACI: The Game', session: myID, address: myAddress });
});

const mongoURL = 'mongodb+srv://' + process.env.MONGO_SERVER;
const dbName = 'ACIGame';
const collectionName = 'leaderboard';
app.get('/leaders', function(req, res, next){
  MongoClient.connect(mongoURL, { useUnifiedTopology: true }, function(err, db){
    if(err) throw err;
    var dbo = db.db(dbName);
    var myLeaders = dbo.collection('leaderboard').find();
    var leaderBoard = [];
    myLeaders.each(function(err, leader){
      if(leader !== null){
        leaderBoard.push(leader);
      }
      else{
        res.render('leaderboard', { leaders: leaderBoard });
      }
    });
    if(myLeaders.length >= leaderBoard.length) db.close();
  });
});
app.get('/leader/:user/:score', function(req, res, next){
  MongoClient.connect(mongoURL, {useUnifiedTopology: true}, function(err, db){
    if(err) throw err;
    var dbo = db.db(dbName);
    var myPlayer = { name: req.params.user, score: req.params.score };
    dbo.collection(collectionName).insertOne(myPlayer, function(err, res){
      if(err) throw err;
      console.log(req.params.user + ' score is recorded!');
      db.close();
    });
    res.render('leaderboard', { leaders: {}  });
  });
});
app.get('/play', function(req, res, next) {
  res.render('play', { title: 'ACI: The Game', status: '' });
});

//Websocket routes
app.get('/start/:id', function(req, res, next) {
  res.io.emit("start", req.params.id);
  res.send('start game');
});
app.get('/move/:id/:pos', function(req, res, next) {
  res.io.emit("move", {id: req.params.id, pos: req.params.pos});
  res.send('move player up');
});
app.get('/end/:id/:score', function(req, res, next) {
  res.io.emit("end", {id: req.params.id, score: req.params.score});
  res.send('end game');
});

//Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
//production error handler
//no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = {app: app, server: server};
