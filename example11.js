var http = require("http").createServer(handler);
var io = require("socket.io").listen(http);
var fs = require("fs");
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){ // ACM Abstract Control Model for serial communication with Arduino (could be USB)
    console.log("Connecting to Arduino");
    board.pinMode(0,board.MODES.ANALOG); // enable analog pin 0
    console.log("Enabling analog Pin 1");
board.pinMode(1, board.MODES.ANALOG); // analog pin 1
});

function handler(req, res) {
fs.readFile(__dirname + "/example11.html",
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
    setInterval(sendValues,10,socket); // on 40ms trigger func. sendValues

}); //end of sockets.on connection 

});

function sendValues (socket){
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue,
    "actualValue": actualValue
    });
};