var SerialPort = require('serialport');
var dataCallback;
var dataBuf = "";
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
var port = new SerialPort('/dev/cu.usbmodem1411', {baudRate:115200, autoOpen:false});
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
  dataBuf += data.toString();
  //console.log(dataBuf);
  if (dataBuf.indexOf('\n') > 0) {
  //if (dataBuf.indexOf('\n') > 0 && dataBuf.indexOf('*') > 0) {
    dataBuf = dataBuf.trim();
    var dataInt = parseInt(dataBuf.slice(1));
    //console.log(dataBuf);
    dataBuf = '';
    if(!isNaN(dataInt)){
      dataCallback(dataInt);
    }
  }

});
// setup(function(data){
//   console.log(data);
// })
module.exports = {
  setup:setup
}
