"use strict"

var express=require('express')
var app=express()
var serialKnob=require('./serial_knob.js')

var server = app.listen(8080,function(){
  console.log("listening on port 8080")
})

var async = require('async')
var dmxController = require('./dmxstrip.js')
var play=require('audio-play')
var load=require('audio-loader')
var context=require('audio-context')
var busboy = require('connect-busboy')
var io = require('socket.io')(server)
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var fs = require('fs')
var loudness = require('loudness');


var url = 'mongodb://localhost:27017/ElevenPlayer'

app.use(busboy())
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'pug')

//USER VARS
var ledTest = false
var zero=0
var knobTimer = 10000
var motor = true

var song
var songs
var playback
var currentValue=0
var currentNumber=0
var prevNumber=0;
var songpath=__dirname+'/public/music/'
var timerCount=new Date().getTime()
var currentTime=new Date().getTime()
var reset=false
var playable=false
var pause ={}
var settings=[]
var tracks = []
var eleven=false
var elevenURL='rickastley.wav'
var dataBuffer = []
var serial=true

function sendData(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to save settings")
    var col=db.collection('numbers')
    col.find().sort({'number':1}).toArray(function(err,obj){
      var data={"number":[]}
      for (var i=0;i<obj.length;i++){
        data.number[i]={}
        data.number[i].activeColor={}
        data.number[i].standbyColor={}
        data.number[i].numValue=obj[i].number
        data.number[i].startPixel=obj[i].lower_address
        data.number[i].stopPixel=obj[i].upper_address
        data.number[i].activeColor.r=obj[i].activeColor.red
        data.number[i].activeColor.g=obj[i].activeColor.green
        data.number[i].activeColor.b=obj[i].activeColor.blue
        data.number[i].standbyColor.r=obj[i].standbyColor.red
        data.number[i].standbyColor.g=obj[i].standbyColor.green
        data.number[i].standbyColor.b=obj[i].standbyColor.blue
      }
      dmxController.resetObj(data)
      db.close()
    })
  })
}

var setupSongs=function(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load songs")
    var col=db.collection('numbers')
    var songs_col=db.collection('songs')
    var trackObj = {}
    playback = {}
    pause = {}
    songs_col.find().sort({'song_group':1}).toArray(function(err,obj){
      for(var i=0;i<obj.length;i++){
        if(obj[i].url==elevenURL){
          trackObj['eleven']=obj[i].url
        }
        else {
          trackObj[i.toString()]=obj[i].url
        }
      }
      console.log("buffering songs...")
      console.log(trackObj)
      db.close()
      load(trackObj,{from:songpath}).then(function(audio){
        playback=audio
        var total=parseInt(Object.keys(playback).length)
        console.log("total keys in playback: "+Object.keys(playback).length)
        playable=true
        for(var i=0;i<total;i++) {
          pause[Object.keys(playback)[i]]=play(playback[Object.keys(playback)[i]])
          pause[Object.keys(playback)[i]].pause()
        }
        console.log("total keys in pause: "+Object.keys(pause).length)
        songSelection()
      })
    })
  })
}

function initSerialKnob(){
  serialKnob.setup(serialData)
}

setupSongs()

sendData()

initSerialKnob()

app.get('/',function(req,res){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load page")
    var col=db.collection('numbers')
    var globals=db.collection('globals')
    col.find().sort({"number": 1}).toArray(function(err,obj){
        "db items found"
        settings=obj
        globals.find({}).toArray(function(err2, obj2){
          loadSongs(db, function(){
            db.close()
            res.render('index',{settings:settings, timer:obj2[0].timer, zero:obj2[0].zero, songs:songs, currentValue:0,currentNumber:0, title:'ElevenPlayer Calibration'})
          })
        })
    })//find all numbers
  })
})

app.post('/upload',function(req,res){
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    fstream = fs.createWriteStream(songpath + filename);
    file.pipe(fstream);
    fstream.on('close', function () {
      MongoClient.connect(url, function(err, db) {
        assert.equal(null, err)
        console.log("Connected successfully to db server to add song")
        var col=db.collection('songs')
        col.find().sort({"song_group": 1}).toArray(function(err,obj){
          col.insertOne({
            'url':filename,
            'song_group':1,
            'volume':1
          },function(){
            db.close()
            res.redirect('back');
          })
        })
      })
    })
  })
})

app.get('/save-settings',function(req,res){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to save settings")
    var col=db.collection('numbers')
    var globals=db.collection('globals')
    col.updateOne({number:parseInt(req.query.current_number)},
      {$set: {
        song_group:parseInt(req.query.song_group),
        lower_address:parseInt(req.query.lower_address),
        upper_address:parseInt(req.query.upper_address),
        lower_value:parseInt(req.query.lower_value),
        upper_value:parseInt(req.query.upper_value),
        activeColor:{
          red:parseInt(req.query.activeRed),
          green: parseInt(req.query.activeGreen),
          blue:parseInt(req.query.activeBlue)
        },
        standbyColor:{
          red:parseInt(req.query.standbyRed),
          green: parseInt(req.query.standbyGreen),
          blue:parseInt(req.query.standbyBlue)
        }
      }
      },
      {upsert:false},
      function(err, r) {
        assert.equal(null, err)
        console.log("numbers matched: "+r.matchedCount)
        globals.updateOne({},{$set:
            {timer:req.query.timer,zero:req.query.zero}
          },
          {upsert:false},
          function(err2,r2){
            assert.equal(null, err2)
            console.log("settings matched: "+r.matchedCount)
            sendData()
            db.close()
            res.redirect('/')
        })
    })
  })
})

app.get('/save-songs', function(req,res){
  MongoClient.connect(url, function(err, db) {
    console.log(req.body.songs)
    assert.equal(null, err)
    console.log("Connected successfully to db server to save songs")
    var col=db.collection('songs')
    col.updateOne({url:req.query.url},
      {$set: {
        song_group:parseInt(req.query.song_group),
        volume:parseInt(req.query.volume)
        }
      },
      {upsert:false},
      function(err, r) {
        assert.equal(null, err)
        console.log("matched: "+r.matchedCount)
        db.close()
        res.redirect('/')
    })
  })
})

app.get('/recache',function(req,res){
  setupSongs()
  res.redirect('/')
})

app.get('/play-eleven',function(req,res){
  playEleven(function(){
    console.log("finished playing 11")
  })
  res.redirect('/')
})

io.on('connection', function(client) {
    console.log('Client connected...');
    io.emit('set_serial',{serial:serial})
    client.on('send_knob', function(data) {
      timerCount= new Date().getTime()
      reset=false
      currentValue=data.currentValue
      adjustKnob()
    });
    client.on('toggle_serial',function(){
      serial=!serial
      console.log('serial set to: '+serial)
      io.emit('set_serial',{serial:serial})
    })
    client.on('toggle_motor',function(){
      motor=!motor
      console.log('motor set to: '+motor)
      io.emit('set_motor',{motor:motor})
    })
});

var loadSongs = function(db, callback){
  var col_songs=db.collection('songs')
  col_songs.find().sort({"song_group": 1}).toArray(function(err_songs,obj_songs){
    // if(obj_songs.length==0){
    //   fs.readdir(songpath, (err, files) => {
    //     if(files.length>0){
    //       var count=0
    //       console.log(songpath)
    //       console.log("generating song db")
    //       files.forEach(file => {
    //         if(! /^\..*/.test(file)) {
    //           // console.log(file)
    //           col_songs.insertOne({
    //             'url':file,
    //             'song_group':1,
    //             'volume':1
    //           },function(){
    //             count++
    //             if(count==files.length){
    //               "retrying with generated list"
    //               callback()
    //             }
    //           })
    //       }//test for hidden file
    //       else{
    //         count++
    //         if(count==files.length){
    //           "retrying with generated list"
    //           callback()
    //         }
    //       }
    //     })
    //   }
    //   else{
    //     songs=[]
    //     callback()
    //   }
    //   })
    // }
      songs=obj_songs
      callback()
  })
}

var checkTime = function(){
  currentTime = new Date().getTime()
  if(eleven==false){
    if(currentTime-timerCount>knobTimer&&currentValue!=0&&reset==false){
      resetKnob()
    }
  }
  if(reset==true&&currentValue<=zero){
    playZero()
  }
  else if(reset==true){
    currentValue--
    adjustKnob()
    io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
  }
  if(currentValue<=zero){
    if(motor) dmxController.motorOff()
  }
}

var resetKnob=function(){
    console.log("reset knob triggered")
    reset=true
    playable=false
    if(motor) dmxController.motorOn()
    if(currentNumber!=0&&eleven==false) {
      for(var i=0;i<Object.keys(pause).length;i++){
        pause[Object.keys(pause)[i]].pause()
      }
    }
}

var adjustKnob=function(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    var col=db.collection('numbers')
    col.find().sort({"lower_value": 1}).toArray(function(err,obj){
      if(currentValue<obj[0].lower_value&&currentNumber!=0){
        playZero()
        db.close()
      }
      else if(currentValue>obj[obj.length-1].upper_value&&currentNumber!=11&&playable){

        for(var i=0;i<Object.keys(pause).length;i++){
          pause[Object.keys(pause)[i]].pause()
        }
        playEleven(function(){
          console.log("finished playing 11")
        })
        db.close()

      }
      else{
        for(var i=0;i<obj.length;i++){
        if(currentValue>=obj[i].lower_value&&currentValue<=obj[i].upper_value){
          if(currentNumber!=obj[i].number){
            changeNumber(col,obj[i].number,function(){})
          }
        }
      }
      db.close()
    }
    })
  })
}

var changeNumber=function(col,num,callback){
  prevNumber=parseInt(currentNumber)
  currentNumber=parseInt(num)
  col.findOne({'number':num},function(err, cur_song){
    console.log(cur_song)
    console.log("number updated to: "+currentNumber)
    io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
    console.log("reset:" +reset)
    console.log("playable: "+playable)
    if(!reset&&playable&&eleven==false){
        for(var i=0;i<Object.keys(pause).length;i++){
          pause[Object.keys(pause)[i]].pause()
        }
        pause[tracks[currentNumber-1].toString()].play()
        // pause[tracks[currentNumber-1].toString()]=play(playback[tracks[currentNumber-1].toString()])
    }
    if(ledTest) dmxController.activateNumberTest(currentNumber,function(){})
    else dmxController.activateNumber(currentNumber,function(){})
    callback()
  })
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

setInterval(checkTime,100)

function songSelection(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load page")
    var col=db.collection('numbers')
    var song_col=db.collection('songs')
    var oneGroup = []
    var twoGroup = []
    var threeGroup = []
    var fourGroup = []
    song_col.find().sort({"song_group":1}).toArray(function(err,obj){
      if(obj.length!=0){
        for (var i=0;i<obj.length;i++){
          if(obj[i].song_group==1) {
            oneGroup.push(i.toString())
          }
          if(obj[i].song_group==2) {
            twoGroup.push(i.toString())
          }
          if(obj[i].song_group==3) {
            threeGroup.push(i.toString())
          }
          if(obj[i].song_group==4) {
            fourGroup.push(i.toString())
          }
        }
        oneGroup=shuffle(oneGroup)
        twoGroup=shuffle(twoGroup)
        threeGroup=shuffle(threeGroup)
        fourGroup=shuffle(fourGroup)

        async.parallel({
          one: function(callback) {
              col.find({"song_group":1}).sort({"number":1}).toArray(function(err,obj){
                callback(null,obj)
              })
          },
          two: function(callback){
            col.find({"song_group":2}).sort({"number":1}).toArray(function(err,obj){
              callback(null,obj)
            })
        },
        three: function(callback){
          col.find({"song_group":3}).sort({"number":1}).toArray(function(err,obj){
            callback(null,obj)
          })
        },
        four: function(callback){
          col.find({"song_group":4}).sort({"number":1}).toArray(function(err,obj){
            callback(null,obj)
          })
        }
        },function(err,results){
          var count=0
          tracks=[]
          for(var i=0;i<results.one.length;i++){
            tracks.push(oneGroup[i])
          }
          for(var i=0;i<results.two.length;i++){
            tracks.push(twoGroup[i])
          }
          for(var i=0;i<results.three.length;i++){
            tracks.push(threeGroup[i])
          }
          for(var i=0;i<results.four.length;i++){
            tracks.push(fourGroup[i])
          }
          console.log('new tracks selected:')
          console.log(tracks)
          db.close()
        })
      }
    })
  })
}

function playEleven(callback){
  eleven=true

  for(var i=0;i<Object.keys(pause).length;i++){
    pause[Object.keys(pause)[i]].pause()
  }
  currentNumber=11
  pause['eleven']=play(playback['eleven'])
  dmxController.activateEleven(function(){
    pause['eleven'].pause()
    reset=true
    playable=false
    callback()
  })
}

function serialData(data){
  if(serial==true){
    if(data!=currentValue){
      // console.log(data)
      timerCount= new Date().getTime()
      if(Math.abs(dataBuffer[0]-data)<40&&Math.abs(dataBuffer[1]-data)<40&&Math.abs(dataBuffer[2]-data)<40){
        console.log("data:"+data)
        currentValue=data
        if(reset&&Math.abs((dataBuffer[0]+dataBuffer[1]+dataBuffer[2])/3-dataBuffer[0]<5)){
          reset=false
          "reset interrupt"
          dmxController.motorOff()
        }
        adjustKnob()
      }
      else{
        console.log("garbage")
      }
      dataBuffer[2]=dataBuffer[1]
      dataBuffer[1]=dataBuffer[0]
      dataBuffer[0]=data
    }
  }
}

function playZero(){
  console.log("knob has reached 0 Position")
  reset=false
  playable=true
  eleven=false
  currentNumber=0

  prevNumber=parseInt(currentNumber)
  for(var i=0;i<Object.keys(pause).length;i++){
    pause[Object.keys(pause)[i]].pause()
  }
  io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
  if(ledTest) dmxController.activateNumberTest(0,function(){})
  else dmxController.activateNumber(0,function(){})
  if(motor) dmxController.motorOff()
  songSelection()

}
