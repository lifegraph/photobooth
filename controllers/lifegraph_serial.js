// Include the serial port module for comm with Arduino
var serialport = require("serialport");

// Grab a reference to SerialPort
var SerialPort = serialport.SerialPort;


// arduino_port is path of arduino USB port
// onPid is a function that gets called when there is a pid
exports.setPidCallback = function(arduino_port, onPid) {
  // Open up comm on the serial port. Put a newline at the end
  var serialPort = new SerialPort(arduino_port, { 
    parser: serialport.parsers.readline("\n") 
  });

  // When the serial port is opened, let us know
  serialPort.on("open", function (){
   console.log("Successfully opened arduino port.")
  });

  // After initialized, when we get a tag from the RF Reader
  serialPort.on("data", function (data) {

    // The prefix we set before the uid on the arduino end of things
    var prefix = "  UID Value: "; // The prefix before the data we care about comes through

    // If we have a uid value
    if (data.indexOf(prefix) == 0) {

      // Grab the uid
      pID = data.substring(prefix.length).trim();

      // console.log("Server received tap from: " + pID);

      // Callback with the pid
      onPid(pid);
    }
  });
}