"use strict"

var DMX = require('./modules/dmx/dmx')
var A = DMX.Animation
var Color = require('color');

var dmx = new DMX()
var channel = 0;
var maxChannels = 216;
var colorPosition = 0;
var duration = 300
var maxPixels = 72;
var currentPixel = 1;
var sparkleInterval;
var chaseInterval;

// var universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-6AVNHXS8')
// var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/cu.usbserial-6AVNHXS8')
var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN199484') // LEIFS DMX BOX

function done() {
    console.log('DONE')
    duration -= 100;
    if (duration > 0) {
        startAnimation(duration)
    }else{
        startSparkle();
    }

}
var setPixel = function(pixelNum, color) {
    var pixObj = {};
    var startChannelNum = pixelNum * 3
    if (pixelNum > maxPixels || pixelNum < 1) {
        console.log("Bad pixelNum ",pixelNum);
    } else {
        pixObj[startChannelNum - 3] = color.red()
        pixObj[startChannelNum - 2] = color.green()
        pixObj[startChannelNum - 1] = color.blue()
    }
    //console.log(JSON.stringify(pixObj));
    return pixObj;
}
var colorObj = function(colorName) {
    var data = {}
        //Clear values
    for (var i = 0; i < 216; i++) {
        //var num=i.toString()
        data[i] = 0
    }
    var start = 0;
    var iter = 1;
    switch (colorName) {
        case "red":
            start = 0;
            iter = 3
            break;
        case "green":
            start = 1;
            iter = 3
            break;
        case "blue":
            start = 2;
            iter = 3
            break;
        case "white":
            start = 0;
            iter = 1
            break;
        case "random":
            start = 4;
            for (var i = 0; i < 216; i += 1) {
                //var num=i.toString()
                data[i] = randomInt(0, 255);
            }
            break;
        case "off":
            start = 3;
            break;
        default:
    }
    if (start < 3) {
        for (var i = start; i < 216; i += iter) {
            //var num=i.toString()
            data[i] = 255
        }
    }
    return data;
}
function allOff(){
    var data = {}
    for (var i = 0; i < 216; i++) {
        //var num=i.toString()
        data[i] = 0
    }
    universe.update(data)
}


var data = {}
for (var i = 0; i < 216; i++) {
    //var num=i.toString()
    data[i] = 255
}

function startAnimation(time) {
    var x = new A()
        .add(colorObj("red"), time,{easing:inElastic})
        .add(colorObj("off"), time)
        .add(colorObj("green"), time)
        .add(colorObj("off"), time)
        .add(colorObj("blue"), time)
        .add(colorObj("off"), time)
        .add(colorObj("white"), time)
        .add(colorObj("off"), time)
        .add(colorObj("random"), time)
        .add(colorObj("off"), time)
    x.run(universe, done)
}
//startAnimation(duration)
var currentColor = Color({
    r: 255,
    g: 0,
    b: 0
});
var colorCounter = 1;
var direction = 1;

function chase() {
    universe.update(setPixel(currentPixel, currentColor))
    currentPixel += direction;
    //console.log(currentPixel);
    if (currentPixel > maxPixels || currentPixel < 1) {
        direction *= -1;
        if (direction > 0) {
            colorCounter++;
            if (colorCounter > 5) {
                //colorCounter = 1;
                clearInterval(chaseInterval);
                startAnimation(duration);
                return true;
            } else {
                return false;
            }
        }
    }
    if (direction == 1) {
        switch (colorCounter) {
            case 1:
                currentColor = Color({
                    r: 255,
                    g: 0,
                    b: 0
                });
                break;
            case 2:
                currentColor = Color({
                    r: 0,
                    g: 255,
                    b: 0
                });
                break;
            case 3:
                currentColor = Color({
                    r: 0,
                    g: 0,
                    b: 255
                });
                break;
            case 4:
                currentColor = Color({
                    r: 255,
                    g: 255,
                    b: 255
                });
                break;
            case 5:
                currentColor = Color({
                    r: randomInt(0, 255),
                    g: randomInt(0, 255),
                    b: randomInt(0, 255)
                });
                break;
            default:

        }

    } else if (direction == -1) {
        //console.log("off");
        currentColor = Color({
            r: 0,
            g: 0,
            b: 0
        });
    }
}
//var previousPixel=0;
function sparkle(){
    // if(previousPixel!=0){
    //     var off = Color({
    //         r: 0,
    //         g: 0,
    //         b: 0
    //     });
    //     universe.update(setPixel(previousPixel, off))
    // }
    var randomPixel = randomInt(1,72);
    var currentColor = Color({
        r: randomInt(0, 255),
        g: randomInt(0, 255),
        b: randomInt(0, 255)
    });
    universe.update(setPixel(randomPixel, currentColor))
    setTimeout(function(){
        turnOffPixel(randomPixel);
    },100);
    //previousPixel = randomPixel;
}
function turnOffPixel(pixel){
        var off = Color({
            r: 0,
            g: 0,
            b: 0
        });
        universe.update(setPixel(pixel, off))
}
function startChase(){
    chaseInterval = setInterval(
        function() {
            chase()
        }, 10)
}
function startSparkle(){
    sparkleInterval = setInterval(
        function() {
            sparkle()
        }, 2)
}

startChase();
//startSparkle();
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


//var color = 0;
function updateStrip() {
    // var red, green, blue;
    // for (red = 0; red <= 255; red++) {
    //     for (green = 0; green <= 255; green++) {
    //         for (blue = 0; blue <= 255; blue++) {
    //             //rgb(red, green, blue)
    //             data[channel] = red;
    //             data[channel+1]= green;
    //             data[channel+2]=blue;
    //             universe.update(data)
    //         }
    //     }
    // }
    // data[channel] = color;
    channel += 3;
    // if(channel>=maxChannels){
    //   color+=8;
    //   channel=colorPosition;
    //   // colorPosition++;
    //   // channel = colorPosition;
    //   if(color>=255){
    //     color = 0;
    //     colorPosition++;
    //     channel = colorPosition;
    //   }
    //   // if(colorPosition>2){
    //   //   colorPosition=0;
    //   //   console.log("DONE");
    //   // }
    // }
    // universe.update(data)
};
function exitHandler(options, err) {
    if (options.cleanup) allOff(); console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
