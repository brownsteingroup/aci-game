//Global websocket stuff
if(location.hostname == 'play.acivision.com'){
  var socket = io('http://204.48.16.97:3000', { transports: ['websocket', 'polling'] });
}
else var socket = io('//' + document.location.hostname + ':' + document.location.port, { transports: ['websocket', 'polling'] });
var controlLoop, myScore = 0;
var myCenter = 50;

function getQueryVariable(variable){
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable) return pair[1];
  }
  return(false);
}
var myID = getQueryVariable('id');

function loadControls(){
  document.body.classList.add('controlling');
  startGame();
}

document.getElementById('upButton').addEventListener('touchstart', function(e){
  document.getElementById('slideControl').value = 1;
});
document.getElementById('downButton').addEventListener('touchstart', function(e){
  document.getElementById('slideControl').value = 100;
});
document.getElementById('upButton').addEventListener('touchend', function(e){
  document.getElementById('slideControl').value = 50;
});
document.getElementById('downButton').addEventListener('touchend', function(e){
  document.getElementById('slideControl').value = 50;
});
document.getElementById('slideControl').addEventListener('touchend', function(e){
  document.getElementById('slideControl').value = 50;
});
document.getElementById('start').addEventListener('touchend', function(e){
  loadControls();
});

//Game over
function endGame(){
  document.body.classList.remove('controlling');
  document.body.classList.add('gameOver');
  clearInterval(controlLoop);
}

var mySlider = document.getElementById('slideControl');

function startGame(){
  var req = new XMLHttpRequest();
  req.open("GET", "start/"+myID, true);
  req.send(null);
  controlLoop = setInterval(function(){
    movePlayer(mySlider.value);
  }, 20);
}
socket.on('end', function(data){
  clearInterval(controlLoop);
  if(data.id == myID){
    endGame();
    myScore = data.score;
    document.getElementById('score').innerHTML = myScore;
  }
});

document.getElementById('submit').addEventListener('click', function(e){
  e.preventDefault();
  var myUser = document.getElementById('name').value;
  var req = new XMLHttpRequest();
  req.open("GET", "leader/"+myUser+"/"+myScore, true);
  req.send(null);
  alert('Thank you! Your score has been submitted.');
  document.getElementById('submit').classList.add('disabled');
  document.getElementById('submit').setAttribute('disabled', 'disabled');
})

var lastPos = myCenter;
//Establish websocket routes
function movePlayer(myPos){
  if(myPos != lastPos){
    var req = new XMLHttpRequest();
    req.open("GET", "move/" + myID + "/" + myPos, true);
    req.send(null);
  }
  lastPos = myPos;
}
