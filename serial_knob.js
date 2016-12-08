var SerialPort = require('serialport');
var dataCallback;
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
function setup(callback){
  dataCallback = callback;
}
var port = new SerialPort('/dev/cu.usbmodem31', {baudRate:115200
  //parser: SerialPort.parsers.readline('\n')
});
// var port = new SerialPort('/dev/cu.usbmodem31', function (err) {
//   if (err) {
//     return console.log('Error: ', err.message);
//   }
// });
port.on('open', function() {
  console.log("Port Open");
});
port.on('data', function (data) {
  //console.log(data.length);
  var dataInt = parseInt(data);
  dataCallback(dataInt);
  //console.log(parseInt(data));
});

module.exports = {
  setup:setup
}
