
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia || navigator.msGetUserMedia;
var video;
var canvas;
var ctx;
var localMediaStream = null;

$(function() {
  video = document.querySelector('video');
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');
});

function snapshot() {
  console.log("snapshot");
  ctx.width = video.width;
  if (localMediaStream) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    var datauri = canvas.toDataURL('image/png');
    document.querySelector('img').src = datauri;
    $.post('/upload', {datauri: datauri}, function (data) {
      console.log(data);
    });
  }
}

function preSnapshot(){
  // does the countdown

  console.log('presnapshot');
  $("#countdown").show();

  var count = 3;
  countdown();
  
  function countdown() {
    console.log("counting down", count);
    $("#countdown").html(count);
    count--;
    if (count < 0) {
      $("#countdown").hide();
      snapshot();
    }
    else {
      setTimeout(countdown, 1000);
    }
  }
}

// video.addEventListener('click', snapshot, false);

$(document).keyup(function(e){
  // console.log("e", e.keyCode);
  if(e.keyCode == 32){
    // user has pressed space
    var notice = $('#notice');
    if (notice.is(":visible")) {
      // toggle the visibility
      notice.toggle();
    } else {
      preSnapshot(); // take the picture
    }
  }
});

function startVideo() {
  navigator.getUserMedia({video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
    $('#got-it').click();
  }, onFailSoHard);
}

function onFailSoHard(err) {
  alert("You need to allow dat vid, dawg.")
  startVideo();
}

startVideo();

var socket = io.connect('http://localhost');
socket.on('startPhoto', function () {
  preSnapshot(); // take the picture
});

// display info message
$('#got-it').click(function(){
  $('#notice').hide();
});

$("#countdown").hide();
