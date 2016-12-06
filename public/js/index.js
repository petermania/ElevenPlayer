$(document).ready(function(){
  $('[name="color"]').css('background-color', "rgb("+settings[0]["red"]+","+settings[0]["green"]+","+settings[0]["blue"]+")")

  $("#dropdown-response > button").on("click", function(e){
    e.stopPropagation();
    e.preventDefault();
    var currentNumber=this.innerHTML
    $('.dropdown').removeClass("open")
    $('[name="current_number"]').val(currentNumber)
    $('[name="lower_value"]').val(settings[currentNumber-1]["lower_value"])
    $('[name="upper_value"]').val(settings[currentNumber-1]["upper_value"])
    $('[name="lower_address"]').val(settings[currentNumber-1]["lower_address"])
    $('[name="upper_address"]').val(settings[currentNumber-1]["upper_address"])
    $('[name="red"]').val(settings[currentNumber-1]["red"])
    $('[name="green"]').val(settings[currentNumber-1]["green"])
    $('[name="blue"]').val(settings[currentNumber-1]["blue"])
    $('[name="color"]').css('background-color', "rgb("+settings[currentNumber-1]["red"]+","+settings[currentNumber-1]["green"]+","+settings[currentNumber-1]["blue"]+")")
  });

  $('.set-lower').on("click",function(e){
    $('[name="lower_value"]').val(currentValue)
  })

  $('.set-color').focusout(function(){
    console.log("trigger")
    var red=$('[name="red"]').val()
    var green=$('[name="green"]').val()
    var blue=$('[name="blue"]').val()
    if (red>255){
      $('[name="red"]').val(255)
      red=255
    }
    else if(red<0){
      $('[name="red"]').val(0)
      red=0
    }
    if (green>255){
      $('[name="green"]').val(255)
      green=255
    }
    else if (green<0){
      $('[name="green"]').val(0)
      green=0
    }
    if (blue>255){
      $('[name="blue"]').val(255)
      blue=255
    }
    else if (blue<0){
      $('[name="blue"]').val(0)
      blue=0
    }
    $('[name="color"]').css('background-color', "rgb("+red+","+green+","+blue+")")
  })
})
