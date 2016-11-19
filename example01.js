var http = require("http");
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0",function(){
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 13");
    board.pinMode(13,board.MODES.OUTPUT); //pin13 as out
    console.log("Activation of Pin 8");
    board.pinMode(8, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
    
});


http.createServer(function (req,res) {
    var parts = req.url.split("/"), //split request on / character
   operator = parseInt(parts[1],10); //10 is radix - decimal notation

    if (operator == 0) {
   console.log("Putting led to OFF");
   board.digitalWrite(13, board.LOW);
   board.digitalWrite(8, board.HIGH);
}
if (operator == 1) {
   console.log("Putting led ON");
   board.digitalWrite(13, board.HIGH);
   board.digitalWrite(8, board.LOW);
}
if (operator == 2) {
   console.log("Putting led OFF");
   board.digitalWrite(8, board.LOW);
}
if (operator == 3) {
   console.log("Putting led ON");
   board.digitalWrite(8, board.HIGH);
}
    
    res.writeHead(200,{"Content-Type": "test/plain"}); //200=OK
    res.write("For test write into browser e.g. 123.1.2.3:8080/1 \n");
    res.end("The value of the operator is : "+ operator);
    
}).listen(8080,"172.16.22.220"); //listen on port 8080