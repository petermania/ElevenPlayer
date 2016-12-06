"use strict"

var express=require('express')
var app=express()
var DMX = require('./modules/dmx/dmx');
var player = require('play-sound')('afplay')
var busboy = require('connect-busboy')

var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var fs = require('fs')

var server = app.listen(8080,function(){
  console.log("listening on port 8080")
})

var url = 'mongodb://localhost:27017/ElevenPlayer'

app.use(busboy())
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'pug')

var dmx = new DMX()
//var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN132514') // SCOTTS DMX BOX
var universe = dmx.addUniverse('1', 'enttec-usb-dmx-pro', '/dev/cu.usbserial-EN199484') // LEIFS DMX BOX
var on = false

var song
var songs=[]
var currentValue=0
var songpath='/public/music/'

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
            'red':255,
            'green':255,
            'blue':255
          },function(){
            count++
            if(count==11){
              "db items created"
              var songs=loadSongs(db, function(){
                db.close()
                res.render('index',{settings:obj, currentValue:1, title:'ElevenPlayer Calibration'})
              })
            }
          })
        }
      }
      else{
        "db items found"
        loadSongs(db, function(){
          db.close()
          console.log(songs)
          res.render('index',{settings:obj, songs:songs, currentValue:1, title:'ElevenPlayer Calibration'})
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
    fstream = fs.createWriteStream(__dirname + songpath + filename);
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
        red:parseInt(req.query.red),
        green: parseInt(req.query.green),
        blue:parseInt(req.query.blue)
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

var loadSongs = function(db, callback){
  var col_songs=db.collection('songs')
  col_songs.find().sort({"song_group": 1}).toArray(function(err_songs,obj_songs){
    if(obj_songs.length==0){
      fs.readdir(__dirname + songpath, (err, files) => {
        console.log(files.length)
        if(files.length>0){
          var count=0
          console.log(__dirname + songpath)
          console.log("generating song db")
          files.forEach(file => {
            if(! /^\..*/.test(file)) {
              console.log(file)
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

// setInterval(function(){
//   if(on){
//     if(song!=undefined) {
//       song.kill()
//       console.log("killing")
//     }
//     var data = {}
//     for(var i=0;i<216;i++){
//       var num=i.toString()
//       data[i]=250
//     }
//     on = false
//     universe.update(data)
//     console.log("off")
//   }
//
//   else{
//     song=player.play('public/music/cantbuymelove.mp3', function(err){
//       if (err&&!err.killed) throw err
//     })
//     var data = {}
//     for(var i=0;i<216;i++){
//       var num=i.toString()
//       data[i]=0
//     }
//     console.log(data)
//     on = true
//     universe.update(data)
//     console.log("on")
//   }
// }, 1000);
