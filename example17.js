var http = require("http").createServer(handler);
var io = require("socket.io").listen(http);
var fs = require("fs");
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){ // ACM Abstract Control Model for serial communication with Arduino (could be USB)
    console.log("Connecting to Arduino");
    board.pinMode(0, board.MODES.ANALOG); // enable analog pin 0
    board.pinMode(1, board.MODES.ANALOG); // analog pin 1
    board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
    board.pinMode(3, board.MODES.PWM); // PWM of motor
    board.pinMode(4, board.MODES.OUTPUT); // direction of DC motor
});

function handler(req, res) {
fs.readFile(__dirname + "/example17.html",
function (err, data) {
if (err) {
res.writeHead(500, {"Content-Type": "text/plain"});
return res.end("Error loading html page.");
}
res.writeHead(200);
res.end(data);
})

}

var desiredValue=0; // desired value var
var actualValue = 0; // variable for actual value (output value)

// PID Algorithm variables
var Kp = 0.55; // proportional factor
var Ki = 0.008; // integral factor
var Kd = 0.15; // differential factor
var pwm = 0;
var pwmLimit = 254;

var err = 0; // variable for second pid implementation
var errSum = 0; // sum of errors
var dErr = 0; // difference of error
var lastErr = 0; // to keep the value of previous error

var controlAlgorithmStartedFlag = 0; // variable for indicating weather the Alg has been start
var intervalCtrl; // var for setInterval in global scope

http.listen(8080);
var sendValueViaSocket = function(){};  //var for sending messages
var sendStaticMsgViaSocket = function() {}; // function to send static message over socket

board.on("ready", function() {
    
board.analogRead(0,function(value){
    desiredValue=value; // continous read of analog pin 0
});

board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
});


io.sockets.on("connection", function(socket) {

    socket.emit("messageToClient", "Srv connected, brd OK");
    socket.emit("staticMsgToClient", "Server connected, board ready.")
    
    setInterval(sendValues,30,socket); // on 40ms trigger func. sendValues
    
    socket.on("startControlAlgorithm",function(numberOfControlAlgorithm){
        startControlAlgorithm(numberOfControlAlgorithm);
    });
    
    socket.on("stopControlAlgorithm",function(){
        stopControlAlgorithm();
    });
    
    sendValueViaSocket = function (value) {
        io.sockets.emit("messageToClient", value);
    }
    
    sendStaticMsgViaSocket = function (value) {
        io.sockets.emit("staticMsgToClient", value);
    }
    

}); //end of sockets.on connection 

}); //end of board.on

function controlAlgorithm (parameters) {
    if (parameters.ctrlAlgNo==1)   
    
    {
        pwm = parameters.pCoeff*(desiredValue-actualValue);
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
        board.analogWrite(3, Math.round(Math.abs(pwm+20)));

    }
    
    if (parameters.ctrlAlgNo==2){
         
      err = desiredValue - actualValue; // error
      errSum += err; // sum of errors, like integral
      dErr = err - lastErr; // difference of error
      pwm = parameters.Kp1*err + parameters.Ki1*errSum + parameters.Kd1*dErr;
      lastErr = err; // save the value for the next cycle
      if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
      if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
      if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
      if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
      board.analogWrite(3, Math.round(Math.abs(pwm)));
            
    }
    
    if (parameters.ctrlAlgNo==3){
         
      err = desiredValue - actualValue; // error
      errSum += err; // sum of errors, like integral
      dErr = err - lastErr; // difference of error
      pwm = parameters.Kp2*err + parameters.Ki2*errSum + parameters.Kd2*dErr;
      lastErr = err; // save the value for the next cycle
      if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
      if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
      if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
      if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
      board.analogWrite(3, Math.round(Math.abs(pwm)));  
            
    }
};

function startControlAlgorithm (parameters) {
    if (controlAlgorithmStartedFlag == 0){
        controlAlgorithmStartedFlag = 1;
        intervalCtrl = setInterval(function() {controlAlgorithm(parameters); }, 30); // na 30ms call
        console.log("Control algorithm started")
        sendStaticMsgViaSocket("Control alg "+ parameters.ctrlAlgNo + "started"+ json2txt(parameters));
        
    }
    
};


function stopControlAlgorithm () {
    clearInterval(intervalCtrl); // clear the interval of control algorihtm
    board.analogWrite(3,0); // write 0 on pwm pin to stop the motor
    controlAlgorithmStartedFlag = 0; // set flag that the algorithm has stopped
    sendStaticMsgViaSocket("Stopped");
    
    err = 0; // variable for second pid implementation
    errSum = 0; // sum of errors
    dErr = 0; // difference of error
    lastErr = 0; // to keep the value of previous error
    pwm = 0;
};


function sendValues (socket){
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm" : pwm
    });
};

function json2txt(obj) // function to print out the json names and values
{
  var txt = '';
  var recurse = function(_obj) {
    if ('object' != typeof(_obj)) {
      txt += ' = ' + _obj + '\n';
    }
    else {
      for (var key in _obj) {
        if (_obj.hasOwnProperty(key)) {
          txt += '.' + key;
          recurse(_obj[key]);
        } 
      }
    }
  };
  recurse(obj);
  return txt;
};