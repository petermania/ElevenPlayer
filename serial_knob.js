var SerialPort = require('serialport');
var dataCallback;
var dataBuf = "";
var ready = false;
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log("comName: "+port.comName);
    console.log("pnpId: "+port.pnpId);
    console.log("manufacturer: "+port.manufacturer);
  });
});
var port = new SerialPort('/dev/cu.usbserial-146', {baudRate:9600, autoOpen:false});
//var port = new SerialPort('/dev/cu.usbmodem1411', {baudRate:115200, autoOpen:false});
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
  setInterval(function(){
    var data = Buffer.from('10', 'hex');
    port.write(data)
  },50)
  setTimeout(function(){
    ready = true;
  },10000)
});
port.on('data', function (data) {
  dataBuf += data.toString();
  var hexData = Buffer.from(data,1,2)
  if(data.length>1){
    //console.log(data.readUIntBE(0, 2));
    var gooddata = data.readUIntBE(0, 2);
    if(gooddata<3400 && ready){
      dataCallback(gooddata)
    }
  }
  //console.log(data)
  //console.log(parseInt(data, 16));
  // if (dataBuf.indexOf('\n') > 0) {
  // //if (dataBuf.indexOf('\n') > 0 && dataBuf.indexOf('*') > 0) {
  //   dataBuf = dataBuf.trim();
  //   var dataInt = parseInt(dataBuf.slice(1));
  //   //console.log(dataBuf);
  //   dataBuf = '';
  //   if(!isNaN(dataInt)){
  //     dataCallback(dataInt);
  //   }
  // }

});

setup(function(data){
  console.log(data);
})
module.exports = {
  setup:setup
}
