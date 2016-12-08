var SerialPort = require('serialport');
var dataCallback;
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
var port = new SerialPort('/dev/cu.usbmodem31', {baudRate:115200, autoOpen:false});
function setup(callback){
  port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message);
  }
});
  dataCallback = callback;
}
port.on('open', function() {
  console.log("Port Open");
});
port.on('data', function (data) {
  var dataInt = parseInt(data);
  dataCallback(dataInt);
});

module.exports = {
  setup:setup
}
