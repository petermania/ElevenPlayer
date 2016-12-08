"use strict"

var DMX = require('./modules/dmx/dmx')
var A = DMX.Animation
var Color = require('color');
var merge = require('merge'),
    original, cloned;
var randomColor = require('randomColor')
var async = require("async")

var dmx = new DMX()
var channel = 0;
var maxChannels = 216;
var colorPosition = 0;
var duration = 300
var maxPixels = 72;
var currentPixel = 1;
var sparkleInterval;
var sparkleBlockInterval
var blockChaseInterval
var radiationInterval
var chaseInterval;
var vortexInterval;
var maxBlocks = 6
var rickBeatTimer = 520
var offColor = Color({
        r: 0,
        g: 0,
        b: 0
    })
    // var universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-6AVNHXS8')
    // var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/cu.usbserial-6AVNHXS8')
var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN199484') // LEIFS DMX BOX
var setupObj = {
    "number": [{
        "numValue": 1,
        "startPixel": 1,
        "stopPixel": 4,
        "activeColor": {
            "r": 229,
            "g": 0,
            "b": 3
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 2,
        "startPixel": 5,
        "stopPixel": 8,
        "activeColor": {
            "r": 225,
            "g": 91,
            "b": 0
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 3,
        "startPixel": 9,
        "stopPixel": 12,
        "activeColor": {
            "r": 221,
            "g": 182,
            "b": 0
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 4,
        "startPixel": 13,
        "stopPixel": 16,
        "activeColor": {
            "r": 162,
            "g": 216,
            "b": 0
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 5,
        "startPixel": 17,
        "stopPixel": 20,
        "activeColor": {
            "r": 62,
            "g": 212,
            "b": 0
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 6,
        "startPixel": 1,
        "stopPixel": 4,
        "activeColor": {
            "r": 0,
            "g": 207,
            "b": 19
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 7,
        "startPixel": 5,
        "stopPixel": 8,
        "activeColor": {
            "r": 0,
            "g": 203,
            "b": 105
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 8,
        "startPixel": 9,
        "stopPixel": 12,
        "activeColor": {
            "r": 0,
            "g": 199,
            "b": 187
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 9,
        "startPixel": 13,
        "stopPixel": 16,
        "activeColor": {
            "r": 0,
            "g": 124,
            "b": 195
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }, {
        "numValue": 10,
        "startPixel": 17,
        "stopPixel": 20,
        "activeColor": {
            "r": 0,
            "g": 40,
            "b": 191
        },
        "standbyColor": {
            "r": 127,
            "g": 127,
            "b": 127
        }
    }]
}

function resetObj(data){
  setupObj=data
  console.log(setupObj)
}

function done() {
    console.log('DONE')
    duration -= 100;
    if (duration > 0) {
        startAnimation(duration)
    } else {
        startSparkle();
    }
}
var setPixel = function(pixelNum, color) {
    var pixObj = {};
    var startChannelNum = pixelNum * 3
    if (pixelNum > maxPixels || pixelNum < 1) {
        console.log("Bad pixelNum ", pixelNum);
    } else {
        pixObj[startChannelNum - 3] = color.red()
        pixObj[startChannelNum - 2] = color.green()
        pixObj[startChannelNum - 1] = color.blue()
    }
    //console.log(JSON.stringify(pixObj));
    return pixObj;
}
var setBlock = function(blockNumber, color) {
    var pixObj = {};
    //start pixel in block = blockNumber*4-3
    var startPixelNum = (blockNumber * 4) - 3
    var stopPixelNum = blockNumber * 4
    var startChannelNum = (startPixelNum * 3) - 3
    var stopChannelNum = (stopPixelNum * 3) - 3
    if (startPixelNum > maxPixels || startPixelNum < 1) {
        console.log("Bad pixelNum ", startPixelNum);
    } else {
        for (var i = startChannelNum; i < stopChannelNum + 1; i += 3) {
            pixObj[i] = color.red()
            pixObj[i + 1] = color.green()
            pixObj[i + 2] = color.blue()
        }
    }
    //console.log(JSON.stringify(pixObj));
    return pixObj;
}
var setBlockPixel = function(blockNumber, pixel, color) {
    var pixObj = {};
    //start pixel in block = blockNumber*4-3
    var startPixelNum = (blockNumber * 4) - 3
    var currentPixel = startPixelNum + (pixel - 1);
    //var stopPixelNum = blockNumber * 4
    var startChannelNum = (currentPixel * 3) - 3
        //var stopChannelNum = (stopPixelNum * 3) - 3
    if (startPixelNum > maxPixels || startPixelNum < 1) {
        console.log("Bad pixelNum ", startPixelNum);
    } else {
        pixObj[startChannelNum] = color.red();
        pixObj[startChannelNum + 1] = color.green();
        pixObj[startChannelNum + 2] = color.blue();
        // for (var i = startChannelNum; i < stopChannelNum + 1; i += 3) {
        //     pixObj[i] = color.red()
        //     pixObj[i + 1] = color.green()
        //     pixObj[i + 2] = color.blue()
        // }
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

function onAllColor(color) {
    var allOut = {}
    for (var i = 1; i < maxBlocks; i++) {
        merge(allOut, setBlock(i, color))
    }
    universe.update(allOut)
}

function allOff() {
    var data = {}
    for (var i = 0; i < 216; i++) {
        //var num=i.toString()
        data[i] = 0
    }
    universe.update(data)
}

function fadeOn(time) {
    var x = new A()
        .add(colorObj("white"), time)
    x.run(universe)
}

function fadeOff(time) {
    var x = new A()
        .add(colorObj("off"), time)
    x.run(universe)
}

function startAnimation(time) {
    var x = new A()
        .add(colorObj("red"), time)
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
// function startAnimation(time) {
//     var x = new A()
//         .add(colorObj("red"), time,{'easing':'inElastic'})
//         .add(colorObj("off"), time,{'easing':'outElastic'})
//         .add(colorObj("red"), time,{'easing':'inQuad'})
//         .add(colorObj("off"), time,{'easing':'outQuad'})
//         .add(colorObj("red"), time,{'easing':'inSine'})
//         .add(colorObj("off"), time,{'easing':'outSine'})
//         .add(colorObj("red"), time,{'easing':'inCirc'})
//         .add(colorObj("off"), time,{'easing':'outCirc'})
//         .add(colorObj("red"), time,{'easing':'inBounce'})
//         .add(colorObj("off"), time,{'easing':'outBounce'})
//         .add(colorObj("red"), time,{'easing':'inExpo'})
//         .add(colorObj("off"), time,{'easing':'outExpo'})
//     x.run(universe, done)
// }
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
function sparkle() {
    // if(previousPixel!=0){
    //     var off = Color({
    //         r: 0,
    //         g: 0,
    //         b: 0
    //     });
    //     universe.update(setPixel(previousPixel, off))
    // }
    var randomPixel = randomInt(1, 21);
    var currentColor = Color({
        r: randomInt(0, 255),
        g: randomInt(0, 255),
        b: randomInt(0, 255)
    });
    universe.update(setPixel(randomPixel, currentColor))
    setTimeout(function() {
        turnOffPixel(randomPixel);
    }, 100);
    //previousPixel = randomPixel;
}

function sparkleBlock(color) {
    // if(previousPixel!=0){
    //     var off = Color({
    //         r: 0,
    //         g: 0,
    //         b: 0
    //     });
    //     universe.update(setPixel(previousPixel, off))
    // }
    var randomBlock = randomInt(1, maxBlocks);
    // var currentColor = Color(randomColor.randomColor({
    //    luminosity: 'dark',
    //    format: 'rgb' // e.g. 'rgb(225,200,20)'
    // }))
    universe.update(setBlock(randomBlock, color))
    setTimeout(function() {
        turnOffBlock(randomBlock);
    }, 100);
    //previousPixel = randomPixel;
}

function turnOffPixel(pixel) {
    var off = Color({
        r: 0,
        g: 0,
        b: 0
    });
    universe.update(setPixel(pixel, off))
}

function turnOffBlock(block) {
    var off = Color({
        r: 0,
        g: 0,
        b: 0
    });
    universe.update(setBlock(block, off))
}

function startChase() {
    chaseInterval = setInterval(
        function() {
            chase()
        }, 10)
}

function startSparkle() {
    sparkleInterval = setInterval(
        function() {
            sparkle()
        }, 2)
}

function startSparkleBlock() {
    sparkleBlockInterval = setInterval(
        function() {
            var currentColor = Color(randomColor.randomColor({
                luminosity: 'dark',
                //hue: 'monochrome',
                format: 'rgb' // e.g. 'rgb(225,200,20)'
            }))
            sparkleBlock(currentColor)
        }, 10)
}

function startBlockChase(adder) {
    currentBlock = 1;
    currentHue = 0;
    blockChaseHueAdder = adder;
    blockChaseInterval = setInterval(
        function() {
            blockChase(94)
        }, rickBeatTimer)
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
var currentBlock = 1;
var currentHue = 0;
var blockChaseHueAdder = 2;
function blockChase(interval, callback) {
    // var currentColor = Color({
    //     r: randomInt(0, 255),
    //     g: randomInt(0, 255),
    //     b: randomInt(0, 255)
    // });
    //var currentColor = Color.rgb(255, 0, 0);
    var currentColor = Color({
        h: currentHue,
        s: 100,
        l: 50
    });
    //var currentColor = Color({hue: currentHue, saturation: 100, lightness: 50})
    //currentColor.hue(currentHue);
    //currentColor.rotate(currentHue);
    //console.log(currentColor.hsl().string());
    //var currentColor = Color.hue(currentHue)
    //currentColor = Color.saturation(100);
    //currentColor = Color.saturationv(100);
    // var currentColor = Color(randomColor.randomColor({
    //    luminosity: 'dark',
    //    //hue: 'monochrome',
    //    format: 'rgb' // e.g. 'rgb(225,200,20)'
    // }))
    var current = currentBlock;
    universe.update(setBlock(currentBlock, currentColor));
    currentBlock++
    currentHue += blockChaseHueAdder
    if (currentBlock > maxBlocks) {
        currentBlock = 1;
        console.log("calling back");
        return callback;
    }
    if (currentHue > 360) {
        currentHue = 0;
    }
    setTimeout(function() {
        blockChase(interval);
        turnOffBlock(current);
    }, interval / 2);
}

var currentBlockPixel = 1;
var maxPixelsPerBlock = 4;
var isOn = true;

function radiation(interval, color, callback) {
    var blockPixObj = {};
    var currentColor;
    if (isOn) {
        // currentColor = Color({
        //     r: 255,
        //     g: 0,
        //     b: 0
        // });
        currentColor = color;
    } else {
        currentColor = Color({
            r: 0,
            g: 0,
            b: 0
        });
    }
    for (var i = 0; i < maxBlocks; i++) {
        merge(blockPixObj, setBlockPixel(i, currentBlockPixel, currentColor));
        //var current = currentBlock;
    }
    universe.update(blockPixObj);
    currentBlockPixel++
    if (currentBlockPixel > maxPixelsPerBlock) {
        currentBlockPixel = 1;
        if (isOn) {
            isOn = !isOn;
        } else {
            isOn = !isOn;
            //return callback;
        }

    }
    // setTimeout(function() {
    //     radiation(interval);
    // }, interval);
}
var currentVotexBlockPixel = 4;
var maxPixelsPerBlock = 4;
var isVotexOn = true;
function vortex(interval,color, callback) {
    var blockPixObj = {};
    var currentColor;
    if (isVotexOn) {
        // currentColor = Color({
        //     r: 0,
        //     g: 0,
        //     b: 255
        // });
        currentColor = color;
    } else {
        currentColor = Color({
            r: 0,
            g: 0,
            b: 0
        });
    }
    for (var i = 0; i < maxBlocks; i++) {
        merge(blockPixObj, setBlockPixel(i, currentVotexBlockPixel, currentColor));
        //var current = currentBlock;
    }
    universe.update(blockPixObj);
    currentVotexBlockPixel--
    if (currentVotexBlockPixel == 0 ) {
        currentVotexBlockPixel = maxPixelsPerBlock;
        if (isVotexOn) {
            isVotexOn = !isVotexOn;
        } else {
            isVotexOn = !isVotexOn;
            //return callback;
        }

    }
    // setTimeout(function() {
    //     radiation(interval);
    // }, interval);
}
function startRadiation() {
    var currentColor = Color(randomColor.randomColor({
        luminosity: 'dark',
        //hue: 'monochrome',
        format: 'rgb' // e.g. 'rgb(225,200,20)'
    }))
    radiationInterval = setInterval(
        function() {
            radiation(94,currentColor)
        }, rickBeatTimer)
}
function startVortex() {
    var currentColor = Color(randomColor.randomColor({
        luminosity: 'dark',
        //hue: 'monochrome',
        format: 'rgb' // e.g. 'rgb(225,200,20)'
    }))
    vortexInterval = setInterval(
        function() {
            vortex(94,currentColor)
        }, rickBeatTimer)
}

function radiationDone() {
    console.log("radiation done");
    duration -= 10;
    if (duration > 0) {
        setTimeout(function() {
            radiation(10, radiationDone());
        }, duration);
        //radiation(duration)
    } else {
        startSparkleBlock();
    }
}

function blockChaseDone() {
    console.log("blockChase done");
    //duration -= 10;
    if (duration > 0) {
        setTimeout(function() {
            blockChase(duration, blockChaseDone());
        }, duration);
        //radiation(duration)
    } else {
        startSparkleBlock();
    }
}

function activateNumber(number, callback) {
    var activeObj = {};
    if (number > setupObj.number.length) {
        return callback("Requested Number Not Setup")
    }
    for (var i = 0; i < setupObj.number.length; i++) {
        if (setupObj.number[i].numValue < number) {
            merge(activeObj, setBlock(setupObj.number[i].numValue, Color(setupObj.number[i].standbyColor)))
        } else if (setupObj.number[i].numValue == number) {
            merge(activeObj, setBlock(setupObj.number[i].numValue, Color(setupObj.number[i].activeColor)))
        }else if (number == 0){
            merge(activeObj, setBlock(setupObj.number[i].numValue, offColor))
        }else {
            merge(activeObj, setBlock(setupObj.number[i].numValue, offColor))
        }
    }
    //console.log(activeObj);
    universe.update(activeObj);
    callback(null,number)
}

function activateEleven(callback) {
    async.series({
        one: function(callback) {
            startBlockChase(2);
            setTimeout(function() {
                clearInterval(blockChaseInterval)
                callback(null, 1)
            }, 10000)
        },
        two: function(callback) {
            startRadiation()
            //radiation(94, radiationDone());
            setTimeout(function() {
                clearInterval(radiationInterval)
                callback(null, 2)
            }, 8000)
        },
        three: function(callback) {
            //startRadiation()
            var blinkInterval = setInterval(function(){
              onAllColor(Color({r:255,g:255,b:255}))
              fadeOff(200)
            },rickBeatTimer)
            setTimeout(function() {
                clearInterval(blinkInterval)
                callback(null, 3)
            }, 9000)
        },
        four: function(callback) {
            //startRadiation()
            startRadiation();
            setTimeout(function() {
                clearInterval(radiationInterval)
                callback(null, 4)
            }, 8000)
        },
        five: function(callback) {
            //startRadiation()
            startBlockChase(32);
            setTimeout(function() {
                clearInterval(blockChaseInterval)
                callback(null, 5)
            }, 8000)
        },
        six: function(callback) {
            //startRadiation()
            startSparkleBlock();
            setTimeout(function() {
                clearInterval(sparkleBlockInterval)
                callback(null, 6)
            }, 8000)
        },
        seven: function(callback) {
            //startRadiation()
            console.log("Starting vortex");
            startVortex();
            setTimeout(function() {
                clearInterval(vortexInterval)
                callback(null, 7)
            }, 9000)
        }
    }, function(err, results) {
        // results is now equal to: {one: 1, two: 2}
        var blinkInterval = setInterval(function(){
          onAllColor(Color({r:255,g:255,b:255}))
          fadeOff((200/4))
      },rickBeatTimer/4)
        setTimeout(function() {
            clearInterval(blinkInterval)
            //callback(null, 3)
            allOff()
            callback(null,"done")
        }, 2000)
    });
}

function activateNumberTest(number, callback) {
    var activeObj = {};
    var maxTest = 5;
    if (number > setupObj.number.length) {
        return callback("Requested Number Not Setup")
    }
    if (number < maxTest + 1) {
        for (var i = 0; i < setupObj.number.length; i++) {
            if (setupObj.number[i].numValue < number) {
                merge(activeObj, setBlock(setupObj.number[i].numValue, Color(setupObj.number[i].standbyColor)))
            } else if (setupObj.number[i].numValue == number) {
                merge(activeObj, setBlock(setupObj.number[i].numValue, Color(setupObj.number[i].activeColor)))
            } else {
                merge(activeObj, setBlock(setupObj.number[i].numValue, offColor))
            }
        }
    } else {
        for (var i = maxTest; i < setupObj.number.length; i++) {
            if (setupObj.number[i].numValue < number) {
                merge(activeObj, setBlock(setupObj.number[i].numValue - maxTest, Color(setupObj.number[i].standbyColor)))
            } else if (setupObj.number[i].numValue == number) {
                merge(activeObj, setBlock(setupObj.number[i].numValue - maxTest, Color(setupObj.number[i].activeColor)))
            }else if (number == 0){
                merge(activeObj, setBlock(setupObj.number[i].numValue, offColor))
            } else {
                merge(activeObj, setBlock(setupObj.number[i].numValue - maxTest, offColor))
            }
        }
    }
    //console.log(activeObj);
    universe.update(activeObj);
    callback(null,number)
}
//////////////////////////////////////////////////////////////
allOff()
duration = 520; // ~113 bpm = 530
//startAnimation(duration)
//
// startBlockChase();
// setTimeout(function(){
//   clearInterval(blockChaseInterval)
// },10000)
//startBlockChase(32);

// var iter = 1;
// var up = 1;
// setInterval(function() {
//         if(iter == 11){
//           console.log("ELEVEN ELEVEN");
//           startSparkleBlock();
//         }else{
//           clearInterval(sparkleBlockInterval)
//           activateNumberTest(iter)
//         }
//         iter+=up;
//         if(iter>=setupObj.number.length+1 || iter == 0){
//           //iter = 1;
//           up=up*-1
//         }
//     }, duration)
//
//
// setInterval(function(){
//   onAllColor(Color({r:255,g:255,b:255}))
//   fadeOff(200)
// },duration)
//activateNumber(2)
//blockChase(94);
//startChase();
//startSparkle();
//

//console.log(colorNow.red());
//radiation(10, radiationDone());
//startSparkleBlock();
// var chaseOut = 10;
// var chaseTime = 500;
//     setInterval(function() {
//             radiation(10);
//         }, chaseTime)
//

//////////////////////////////////////////////////////////////
module.exports = {
    activateNumber: activateNumber,
    activateEleven: activateEleven,
    activateNumberTest:activateNumberTest,
    resetObj: resetObj
}




//////////////////////////////////////////////////////////////


function exitHandler(options, err) {
    if (options.cleanup) allOff();
    console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));
