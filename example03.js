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
   operator1= parseInt(parts[1],10), //10 is radix - decimal notation
   operator2 = parseInt(parts[1],10); // 10 is radix - decimal notation;

if (operator1 == 0) {
   console.log("Putting led to OFF");
   board.digitalWrite(13, board.LOW);
}
if (operator1 == 1) {
   console.log("Putting led ON");
   board.digitalWrite(13, board.HIGH);
}
if (operator2 == 0) {
  console.log("Putting led OFF");
  board.digitalWrite(8, board.LOW);
}
    if (operator2 == 1) {
    console.log("Putting led ON");
    board.digitalWrite(8, board.HIGH);
}
    res.writeHead(200,{"Content-Type": "test/plain"}); //200=OK
    res.write("For test write into browser e.g. 123.1.2.3:8080/1 \n");
    res.end("The value of the operator1 is : "+ operator1+'\n'+"The value of the operator2 is : "+operator2);
    
}).listen(8080,"172.16.22.220"); //listen on port 8080