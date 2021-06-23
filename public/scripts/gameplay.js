//Globals
// if(location.hostname == 'play.acivision.com'){
//   var socket = io('http://204.48.16.97:3000', { transports: ['websocket', 'polling'] });
// }
var myAddress = document.getElementById('qr').dataset.address;
var socket = io('//' + document.location.hostname + ':' + document.location.port, { transports: ['websocket', 'polling'] });

var myPlayer = document.getElementById('player');

//Generate QR code with session ID
var myID = document.getElementById('session').innerHTML;
if(location.hostname == 'localhost'){
  var socketURL = location.protocol + '//' + myAddress + ((document.location.port !== '') ? ':' + document.location.port : '') + '/play?id=' + myID;
  makeQR(socketURL);
}
else{
  var socketURL = location.protocol + '//' + location.hostname + ((document.location.port !== '') ? ':' + document.location.port : '') + '/play?id=' + myID;
  makeQR(socketURL);
}

function makeQR(socketURL){
  var qrcode = new QRCode('qr', {
    //text: 'http://192.168.1.166:3000/play?id='+myID,
    text: socketURL,
    width: 1000,
    height: 1000,
    colorDark: '#db6027',
    colorLight : '#FFFFFF',
    correctLevel : QRCode.CorrectLevel.H
  });
}

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    if(sortOrder >= -1){
      return b[property] - a[property];
    } else{
      return a[property] - b[property];
    }
  }
}

var scoreInterval;
const leaderBoard = document.getElementById('leaderBoard');
var scorePos = 0;
function scoreLoop(){
  var leaderList = document.getElementById('leaderList');
  clearInterval(scoreInterval);
  setTimeout(function(){
    var leaders = document.querySelectorAll('#leaderList div');
    if(leaders.length > 1){
      scoreInterval = setInterval(function(){
        if(parseInt(leaderList.style.left) <= -(leaderList.offsetWidth/3)){
          scorePos = 0;
        }
        else scorePos--;
        leaderList.style.left = scorePos + 'px';
      }, 10);
    }
  }, 1000);
}

function getLeaders(yourUrl){
  const leaderBoard = document.getElementById('leaderList');
  const leaderWrap = document.getElementById('leaderBoard');
  var req = new XMLHttpRequest(); // a new request
  req.open('GET', '/leaders', false);
  req.send(null);
  var leaders = JSON.parse(req.responseText.split());
  var sortedLeaders = leaders.sort(dynamicSort('score'));
  leaderBoard.innerHTML = '';
  if(leaders.length){
    for(var i = 0; i < 5; i++){
      if(sortedLeaders[i]){
        leaderWrap.style.opacity = 1;
        var myLeader = document.createElement('div');
        var myWrapper = document.createElement('span');
        myWrapper.append('#' + (i+1) + ' ' + sortedLeaders[i].name + ' - ' + sortedLeaders[i].score);
        myLeader.append(myWrapper);
        leaderBoard.appendChild(myLeader);
      }
    }
    if(leaders.length > 1){
      for(var i = 0; i < 5; i++){
        if(sortedLeaders[i]){
          leaderWrap.style.opacity = 1;
          var myLeader = document.createElement('div');
          var myWrapper = document.createElement('span');
          myWrapper.append('#' + (i+1) + ' ' + sortedLeaders[i].name + ' - ' + sortedLeaders[i].score);
          myLeader.append(myWrapper);
          leaderBoard.appendChild(myLeader);
        }
      }
      for(var i = 0; i < 5; i++){
        if(sortedLeaders[i]){
          leaderWrap.style.opacity = 1;
          var myLeader = document.createElement('div');
          var myWrapper = document.createElement('span');
          myWrapper.append('#' + (i+1) + ' ' + sortedLeaders[i].name + ' - ' + sortedLeaders[i].score);
          myLeader.append(myWrapper);
          leaderBoard.appendChild(myLeader);
        }
      }
    }
    scoreLoop();
  }
  else leaderWrap.style.opacity = 0;
}

//Event bindings
socket.on('start', function(data){
  if(data == myID && !document.body.classList.contains('playing')){
    setupGame();
    gameLoop();
  }
});

var myPos = 0, myAcceleration = 0;
socket.on('move', function(data){
  if(data.id == myID){
    myAcceleration = 5 * (data.pos - 50);
  }
});

function movePlayer(){
  myPos = parseInt(myPlayer.style.top, 10);
  if(myPos < 0){
    myPos = 0, myAcceleration = 0;
  }
  else if(myPos > window.outerHeight - 350){
    myPos = window.outerHeight - 401, myAcceleration = 0;
  }
  myPlayer.style.top = myPos + myAcceleration + 'px';
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Gameplay
var itemWrap = document.getElementById('items'), myTimer = document.getElementById('timer'), score = document.getElementById('score');
var generateLoop = null, timerLoop = null, playerLoop = null, itemLoops = [];
var itemCount = 0, myScore = 0, realScore = 0, scoreMultiplier = 1;
var totalTime = 30, itemSpeed = 100, myPercent = 0, myTime = totalTime, frameTime = 100, generateRate = 750, myProgress = document.getElementById('progressFill');
var stage1 = false, stage2 = false, stage3 = false;

function setupGame(){
  myScore = 0, realScore = 0, myPercent = 0;
  myAcceleration = 0, itemSpeed = 100;
  itemCount = 0, myTime = totalTime;
  myProgress.style.width = '0%';
  myTimer.innerHTML = ':' + totalTime;
  score.innerHTML = '0';
  myPlayer.style.top = (window.outerHeight/2 - 250) + 'px';
  getLeaders();
}
setupGame();

var catchEffect = document.getElementById('catchEffect'), scoreElem = document.getElementById('score');
function gameLoop(){
  document.body.classList.add('playing');
  clearInterval(scoreInterval);
  timerLoop = setInterval(function(){
    if(myTime < 1){
      setTimeout(function(){
        gameOver();
      }, generateRate);
    }
    else{
      myTime -= 1;
      myTimer.innerHTML = ':' + (myTime < 10 ? '0' : '') + myTime;
    }
  }, 1000);
  playerLoop = setInterval(function(){
    movePlayer();
  }, frameTime);
  generateLoop = setInterval(function(){
    if (myTime > 0) {
      var item = document.createElement('div');
      item.className = 'item dollar';
      item.style.left = '-235px';
      item.style.top = getRandomInt(50, window.outerHeight - 450) + 'px';
      itemWrap.append(item);
      itemCount++;
      itemLoops[itemCount] = setInterval(function(itemCount, item){
        var myLeft = parseInt(item.style.left, 10);
        itemSpeed = itemSpeed + (itemCount/70);
        myLeft += itemSpeed;
        item.style.left = myLeft + 'px';
        if((myLeft + 50 > myPlayer.getBoundingClientRect().left)
        && (myLeft + 50 < myPlayer.getBoundingClientRect().left + 200)
        && (parseInt(item.style.top, 10) > parseInt(myPlayer.style.top, 10) - 100)
        && (parseInt(item.style.top, 10) < parseInt(myPlayer.style.top, 10) + 217)){
          realScore += scoreMultiplier;
          myScore += scoreMultiplier
          myPercent = 100*(((realScore + scoreMultiplier)/scoreMultiplier)/((totalTime*1000)/generateRate));
          //Score multipliers
          if(myPercent > 33 && stage1 == false){
            stage1 = true;
            scoreElem.classList.add('popIn');
            setTimeout(function(){
              scoreElem.classList.remove('popIn');
            }, 1000);
            myScore = realScore*2;
          }
          if(myPercent > 66 && stage2 == false){
            stage2 = true;
            scoreElem.classList.add('popIn');
            setTimeout(function(){
              scoreElem.classList.remove('popIn');
            }, 1000);
            myScore = realScore*4;
          }
          if(myPercent > 99 && stage3 == false){
            stage3 = true;
            scoreElem.classList.add('popIn');
            setTimeout(function(){
              scoreElem.classList.remove('popIn');
            }, 1000);
            myScore = realScore*6;
          }
          //Catch animation
          catchEffect.classList.add('triggered');
          setTimeout(function(){
            catchEffect.classList.remove('triggered');
          }, 400);
          //Update score
          myProgress.style.width =  myPercent + '%';
          score.innerHTML = myScore;
          //Remove caught item
          item.remove();
          clearInterval(itemLoops[itemCount]);
        }
        else if(myLeft > window.outerWidth + 200){
          clearInterval(itemLoops[itemCount]);
          item.remove();
        }
      }, frameTime, itemCount, item);
    }
  }, generateRate);
}

var endScore = document.getElementById('finalScore');
var endPercent = document.getElementById('endPercent');
function gameOver(){
  myAcceleration = 0, stage1 = false, stage2 = false, stage3 = false;
  //Display end score
  endScore.innerHTML = myScore;
  //Clear gameplay loops
  clearInterval(timerLoop);
  clearInterval(generateLoop);
  clearInterval(playerLoop);
  itemLoops = [];
  //Tell phone the game is over
  setTimeout(function(){
    //Move to next frame on TV/phone
    document.body.classList.remove('playing');
    document.body.classList.add('stopGame');
    req = new XMLHttpRequest();
    req.open("GET", "end/"+myID+"/"+myScore, true);
    req.send(null);
  }, 300);
  //Reset everything
  setTimeout(function(){
    document.body.classList.remove('stopGame');
    setupGame();
  }, 7500);
}
