var http = require("http").createServer(handler); // on request - hand
var io=require("socket.io").listen(http); // socket library
var fs=require("fs"); // variable for file sistem for providing html
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0",function(){
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 13");
    board.pinMode(13,board.MODES.OUTPUT); //pin13 as out
    console.log("Activation of Pin 8");
    board.pinMode(8,board.MODES.OUTPUT); //pin13 as out
    console.log("Enabling Push Button on pin 2");
    board.pinMode(2, board.MODES.INPUT);
    
});

function handler(req,res) {
    fs.readFile(__dirname+"/example07.html",
    function(err,data){
        if (err) {
            res.writeHead(500,{"Content-Type": "text/plain"});
            return res.end("Error loading html page");
        }
    res.writeHead(200);
    res.end(data);
    });
}


http.listen(8080); //server will listen on port 8080

var sendValueViaSocket;//var for sending messages

board.on("ready",function(){
    
io.sockets.on("connection", function(socket){
    socket.emit('messageToClient', "Srv connected, brd OK");// when we receive the message
    
    sendValueViaSocket=function(value){
        io.sockets.emit("messageToClient",value);
    }
}); // end of sockets.on


    board.digitalRead(2, function(value) {
        if (value == 0) {
            console.log("LED OFF");
            board.digitalWrite(13, board.LOW);
            console.log("Value = 0");
            socket.emit("messageToClient", "Value = 0");
        }
        if (value == 1) {
            console.log("LED ON");
            board.digitalWrite(13, board.HIGH);
            console.log("Value = 1");
            socket.emit("messageToClient", "Value = 1");
        }
        
    }),
};



  


io.sockets.on("connection", function (socket){
    console.log("Socket id: "+ socket.id),
    socket.on("commandToArduino", function(commandNo){
        if (commandNo=="1"){
            board.digitalWrite(13,board.HIGH); // write high on pin 13
        }
        if (commandNo== "0"){
            board.digitalWrite(13,board.LOW); // write low on pin 13
        }
        if (commandNo == "2") {
            board.digitalWrite(8, board.LOW); // write LOW on pin 8
        }
        if (commandNo == "3") {
            board.digitalWrite(8, board.HIGH); // write HIGH on pin 8
        }  
    });
});