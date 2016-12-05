"use strict"

var DMX = require('./modules/dmx/dmx');
var A = DMX.Animation;
var player = require('play-sound')('afplay')

var dmx = new DMX();
// var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/cu.usbserial-6AVNHXS8')
//var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN132514') // SCOTTS DMX BOX
var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN199484') // LEIFS DMX BOX
// var universe = dmx.addUniverse('demo', 'null')

var on = false;

var song;


setInterval(function(){
  if(on){
    song=player.play('./music/cantbuymelove.mp3', function(err){
      if (err&&!err.killed) throw err
    })
    var data = {}
    for(var i=0;i<216;i++){
      var num=i.toString()
      data[i]=250
    }
    console.log(data)
    on = false
    universe.update(data)
    console.log("off")
  }else{
    if(song!=undefined) {
      song.kill()
      console.log("killing")
    }
    var data = {}
    for(var i=0;i<216;i++){
      var num=i.toString()
      data[i]=0
    }
    console.log(data)
    on = true
    universe.update(data)
    console.log("on")
  }
}, 1000);
