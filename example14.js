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
fs.readFile(__dirname + "/example14.html",
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
var factor = 0.3; // proportional factor that determines the speed of aproaching toward desired value
var pwm=0;

var controlAlgorithmStartedFlag = 0; // variable for indicating weather the Alg has been start
var intervalCtrl; // var for setInterval in global scope

http.listen(8080);
var sendValueViaSocket = function(){};  //var for sending messages

board.on("ready", function() {
    
board.analogRead(0,function(value){
    desiredValue=value; // continous read of analog pin 0
});

board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
});


io.sockets.on("connection", function(socket) {

    socket.emit("messageToClient", "Srv connected, brd OK");
    setInterval(sendValues,30,socket); // on 40ms trigger func. sendValues
    
    socket.on("startControlAlgorithm",function(){
        startControlAlgorithm();
    });
    
    socket.on("stopControlAlgorithm",function(){
        stopControlAlgorithm();
    });
    
    

}); //end of sockets.on connection 

}); //end of board.on

function controlAlgorithm () {
    pwm = factor*(desiredValue-actualValue);
    if(pwm > 255) {pwm = 255}; // to limit the value for pwm / positive
    if(pwm < -255) {pwm = -255}; // to limit the value for pwm / negative
    if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
    if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
    board.analogWrite(3, Math.abs(pwm)+20);
};

function startControlAlgorithm () {
    if (controlAlgorithmStartedFlag==0){
        controlAlgorithmStartedFlag = 1;
        intervalCtrl = setInterval(function() {controlAlgorithm(); }, 30); // na 30ms call
        console.log("Control algorithm started")
    }
    
};


function stopControlAlgorithm () {
    clearInterval(intervalCtrl); // clear the interval of control algorihtm
    board.analogWrite(3,0); // write 0 on pwm pin to stop the motor
    controlAlgorithmStartedFlag = 0; // set flag that the algorithm has stopped
};


function sendValues (socket){
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm" : pwm
    });
};