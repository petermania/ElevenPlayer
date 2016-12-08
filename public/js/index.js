var server_location='http://localhost:8080/'
var socket = io.connect(server_location)

socket.on('connect', function(data) {
    console.log('connecting')
    socket.emit('join', 'Hello World from client')
})

socket.on('receive_knob',function(data){
  console.log("updating: "+data.currentNumber)
  currentValue=data.currentValue
  currentNumber=data.currentNumber
  $('[name="current_knob"]').val(currentValue)
  $('[name="current_active"]').val(currentNumber)
})

$(document).ready(function(){
  console.log(settings)
  console.log("color: "+settings[0]['activeColor']["red"])
  var red=$('[name="activeRed"]').val()
  var green=$('[name="activeGreen"]').val()
  var blue=$('[name="activeBlue"]').val()
  $('[name="activeColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  red=$('[name="standbyRed"]').val()
  green=$('[name="standbyGreen"]').val()
  blue=$('[name="standbyBlue"]').val()
  $('[name="standbyColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  $("#dropdown-response > button").on("click", function(e){
    e.stopPropagation();
    e.preventDefault();
    var currentNumber=this.innerHTML
    $('.dropdown').removeClass("open")
    $('[name="current_number"]').val(currentNumber)
    $('[name="song_group"]').val(settings[currentNumber-1]["song_group"])
    $('[name="lower_value"]').val(settings[currentNumber-1]["lower_value"])
    $('[name="upper_value"]').val(settings[currentNumber-1]["upper_value"])
    $('[name="lower_address"]').val(settings[currentNumber-1]["lower_address"])
    $('[name="upper_address"]').val(settings[currentNumber-1]["upper_address"])
    $('[name="activeRed"]').val(settings[currentNumber-1]['activeColor']["red"])
    $('[name="activeGreen"]').val(settings[currentNumber-1]['activeColor']["green"])
    $('[name="activeBlue"]').val(settings[currentNumber-1]['activeColor']["blue"])
    $('[name="standbyRed"]').val(settings[currentNumber-1]['standbyColor']["red"])
    $('[name="standbyGreen"]').val(settings[currentNumber-1]['standbyColor']["green"])
    $('[name="standbyBlue"]').val(settings[currentNumber-1]['standbyColor']["blue"])
    var red=$('[name="activeRed"]').val()
    var green=$('[name="activeGreen"]').val()
    var blue=$('[name="activeBlue"]').val()
    $('[name="activeColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
    var red=$('[name="standbyRed"]').val()
    var green=$('[name="standbyGreen"]').val()
    var blue=$('[name="standbyBlue"]').val()
    $('[name="standbyColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  })

  $('.set-lower').on("click",function(e){
    $('[name="lower_value"]').val(currentValue)
  })

  $('.set-upper').on("click",function(e){
    $('[name="upper_value"]').val(currentValue)
  })

  $('.set-active-color').focusout(function(){
    console.log("trigger")
    var red=$('[name="activeRed"]').val()
    var green=$('[name="activeGreen"]').val()
    var blue=$('[name="activeBlue"]').val()
    if (red>255){
      $('[name="activeRed"]').val(255)
      red=255
    }
    else if(red<0){
      $('[name="activeRed"]').val(0)
      red=0
    }
    if (green>255){
      $('[name="activeGreen"]').val(255)
      green=255
    }
    else if (green<0){
      $('[name="activeGreen"]').val(0)
      green=0
    }
    if (blue>255){
      $('[name="activeBlue"]').val(255)
      blue=255
    }
    else if (blue<0){
      $('[name="activeBlue"]').val(0)
      blue=0
    }
    $('[name="activeColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  })

  $('.set-standby-color').focusout(function(){
    console.log("trigger")
    var red=$('[name="standbyRed"]').val()
    var green=$('[name="standbyGreen"]').val()
    var blue=$('[name="standbyBlue"]').val()
    if (red>255){
      $('[name="standbyRed"]').val(255)
      red=255
    }
    else if(red<0){
      $('[name="standbyRed"]').val(0)
      red=0
    }
    if (green>255){
      $('[name="standbyGreen"]').val(255)
      green=255
    }
    else if (green<0){
      $('[name="standbyGreen"]').val(0)
      green=0
    }
    if (blue>255){
      $('[name="standbyBlue"]').val(255)
      blue=255
    }
    else if (blue<0){
      $('[name="standbyBlue"]').val(0)
      blue=0
    }
    $('[name="standbyColor"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  })

  $('[name="knob"]').on('click',function(){
    if($(this).val()=="up") currentValue++
    else if($(this).val()=="down") currentValue--
    $('[name="current_knob"]').val(currentValue)
    socket.emit('send_knob',{currentValue:currentValue})
  })
})
