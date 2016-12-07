"use strict"

var express=require('express')
var app=express()

var server = app.listen(8080,function(){
  console.log("listening on port 8080")
})

var async = require('async')
var DMX = require('./modules/dmx/dmx');
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

var dmx = new DMX()
//var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN132514') // SCOTTS DMX BOX
var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN199484') // LEIFS DMX BOX
var on = false

var song
var songs
var playback
var pause
var currentValue=0
var currentNumber=0
var songpath=__dirname+'/public/music/'
var knobTimer = 10000
var timerCount=new Date().getTime()
var currentTime=new Date().getTime()
var prevNumber=0;
var reset=false
var pause ={}
var tracks = []

var setupSongs=function(){
  MongoClient.connect(url, function(err, db) {
    var count=0
    assert.equal(null, err)
    console.log("Connected successfully to db server to load songs")
    var col=db.collection('numbers')
    var songs_col=db.collection('songs')
    var trackObj = {}
    var count=1
    songs_col.find().sort({'song_group':1}).toArray(function(err,obj){
      console.log(obj)
      for(var i=0;i<obj.length;i++){
        trackObj[i.toString()]=obj[i].url
      }
      console.log(trackObj)
      console.log("loading songs...")
      load(trackObj,{from:songpath}).then(function(audio){
        playback=audio
        console.log(playback)
        songSelection()
      })
    })
    //   async.parallel({
    //     numbers_one: function(callback) {
    //       col.find({"song_group":1}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     songs_one: function(callback) {
    //       songs_col.find({"song_group":1}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     numbers_two: function(callback) {
    //       col.find({"song_group":2}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     songs_two: function(callback) {
    //       songs_col.find({"song_group":2}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     numbers_three: function(callback) {
    //       col.find({"song_group":3}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     songs_three: function(callback) {
    //       songs_col.find({"song_group":3}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     numbers_four: function(callback) {
    //       col.find({"song_group":4}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     },
    //     songs_four: function(callback) {
    //       songs_col.find({"song_group":4}).toArray(function(err,obj){
    //         callback(err,obj)
    //       })
    //     }
    // }, function(err, results) {
    //   if(results.songs_one.length!=0){
    //     console.log("radomizing tracks")
    //     var ss_one=shuffle(results.songs_one)
    //     var ss_two=shuffle(results.songs_two)
    //     var ss_three=shuffle(results.songs_three)
    //     var ss_four=shuffle(results.songs_four)
    //     console.log("tracks radomized")
    //     for(var i=0;i<results.numbers_one.length;i++){
    //       trackObj[results.numbers_one[i].number.toString()]=ss_one[i].url
    //     }
    //     for(var i=0;i<results.numbers_two.length;i++){
    //       trackObj[results.numbers_two[i].number.toString()]=ss_two[i].url
    //     }
    //     for(var i=0;i<results.numbers_three.length;i++){
    //       trackObj[results.numbers_three[i].number.toString()]=ss_three[i].url
    //     }
    //     for(var i=0;i<results.numbers_four.length;i++){
    //       trackObj[results.numbers_four[i].number.toString()]=ss_four[i].url
    //     }
    //     console.log("loading tracks")
    //     load(trackObj,{from:songpath}).then(function(audio){
    //       playback=audio
    //       console.log("tracks loaded")
    //     })
    //   }
    // })
  })
}

setupSongs()

app.get('/',function(req,res){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load page")
    var col=db.collection('numbers')
    col.find().sort({"number": 1}).toArray(function(err,obj){
      if(obj.length==0)
      {
        var count=0
        for(var i=1;i<12;i++){
          col.insertOne({
            'number':i,
            'song_group':0,
            'lower_address':0,
            'upper_address':0,
            'lower_value':0,
            'upper_value':0,
            'activeColor':{
              'red':255,
              'green':255,
              'blue':255
            },
            'standbyColor':{
              'red':255,
              'green':255,
              'blue':255
            }
          },function(){
            count++
            if(count==11){
              "db items created"
              loadSongs(db, function(){
                db.close()
                res.render('index',{settings:obj, currentValue:0, currentNumber:0, title:'ElevenPlayer Calibration'})
              })
            }
          })
        }
      }
      else{
        "db items found"
        loadSongs(db, function(){
          db.close()
          console.log(obj)
          res.render('index',{settings:obj, songs:songs, currentValue:0,currentNumber:0, title:'ElevenPlayer Calibration'})
        })
      }
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
            res.redirect('back');
          })
        })
      })
    })
  })
})

app.get('/save-settings',function(req,res){
  // console.log("***GET QUERY***")
  // console.dir(req.query)
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to save settings")
    var col=db.collection('numbers')
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
        console.log("matched: "+r.matchedCount)
        res.redirect('/')
    })
  })
})

app.get('/save-songs', function(req,res){
  MongoClient.connect(url, function(err, db) {
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
        res.redirect('/')
    })
  })
})

io.on('connection', function(client) {
    console.log('Client connected...');
    client.on('send_knob', function(data) {
      timerCount= new Date().getTime()
      // console.log("knob updated from client")
      // console.log(data)
      currentValue=data.currentValue
      adjustKnob()
    });
});

var loadSongs = function(db, callback){
  var col_songs=db.collection('songs')
  col_songs.find().sort({"song_group": 1}).toArray(function(err_songs,obj_songs){
    if(obj_songs.length==0){
      fs.readdir(songpath, (err, files) => {
        console.log(files.length)
        if(files.length>0){
          var count=0
          console.log(songpath)
          console.log("generating song db")
          files.forEach(file => {
            if(! /^\..*/.test(file)) {
              // console.log(file)
              col_songs.insertOne({
                'url':file,
                'song_group':1,
                'volume':1
              },function(){
                count++
                if(count==files.length){
                  "retrying with generated list"
                  callback()
                }
              })
          }//test for hidden file
          else{
            count++
            if(count==files.length){
              "retrying with generated list"
              callback()
            }
          }
        })
      }
      else{
        songs=[]
        callback()
      }
      })
    }
    else{
      songs=obj_songs
      callback()
    }
  })
}

var checkTime = function(){
  currentTime = new Date().getTime()
  if(currentTime-timerCount>knobTimer&&currentValue!=0&&reset==false){
    resetKnob()
  }
  if(reset==true&&currentValue==0){
    knobZero()
  }
  else if(reset==true){
    currentValue--
    adjustKnob()
    io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
  }
}

var resetKnob=function(){
    reset=true
    if(currentNumber!=0) {
      console.log("closing track "+prevNumber)
      pause[tracks[currentNumber-1].toString()].pause()
    }
}

var knobZero=function(){
  reset=false
  currentNumber=0
  console.log("knob has reached 0 Position")
  songSelection()
  io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
}

var adjustKnob=function(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    // console.log("Connected successfully to db server to check values")
    var col=db.collection('numbers')
    col.find().sort({"lower_value": 1}).toArray(function(err,obj){
      for(var i=0;i<obj.length;i++){
        // console.log(obj[i])
        if(currentValue>=obj[i].lower_value&&currentValue<=obj[i].upper_value){
          if(currentNumber!=obj[i].number){
            var direction
            if(currentNumber>obj[i].number) direction=0
            else if(currentNumber<obj[i].number) direction=1
            changeNumber(col,direction,obj[i].number,function(){
              db.close()
            })
          }
        }
      }
    })
  })
}

var changeNumber=function(col,direction,num,callback){
  console.log(currentNumber)
  // playback[currentNumber].pause()
  prevNumber=parseInt(currentNumber)
  currentNumber=parseInt(num)
  col.findOne({'number':num},function(err, cur_song){
    console.log(cur_song)
    console.log("number updated to: "+currentNumber)
    io.emit('receive_knob',{currentValue:currentValue,currentNumber:currentNumber})
    if(reset==false){
        if(prevNumber!=0) {
          console.log("closing track "+prevNumber)
          pause[tracks[prevNumber-1].toString()].pause()
        }
        pause[tracks[currentNumber-1].toString()]=play(playback[tracks[currentNumber-1].toString()])
        callback()
    }
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
        console.log(oneGroup)
        console.log(twoGroup)
        console.log(threeGroup)
        console.log(fourGroup)

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
            console.log(oneGroup[i])
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
          console.log(tracks)
        })

        // tracks=oneGroup.concat(twoGroup).concat(threeGroup).concat(fourGroup)


      }
    })

  })
}
