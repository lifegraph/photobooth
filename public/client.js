
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia || navigator.msGetUserMedia;
var video;
var canvas;
var ctx;
var localMediaStream = null;
var withPhysicalToken = false;
var currentCountdownTimer = null;

$(function() {
  video = document.querySelector('video');
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');

  $("#countdown").hide();

  $('#closeAfterPhoto').click(function () {
    $('#afterPhoto').hide();
  });
  $('#afterPhoto').click(function() { return false;});

  $('#sendToFB').click(function() {
    console.log("clicked");
    $('#afterPhoto').hide();
    window.location.href = '/send_to_fb'
  });
  startVideo();
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
    console.log('saving photo. with phys?', withPhysicalToken);
    $.post('/save_photo', {datauri: datauri, withPhysicalToken: withPhysicalToken}, function (data) {
      console.log(data);
    });
  }

  if (!withPhysicalToken) {
    // if we don't have a physical token, show the post to fb message
    $('#afterPhoto').show();
  }

  withPhysicalToken = false;
}

function preSnapshot(){
  // does the countdown
  if (currentCountdownTimer) {
    clearTimeout(currentCountdownTimer);
  }
  console.log('presnapshot');
  $('#afterPhoto').hide();
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
      currentCountdownTimer = setTimeout(countdown, 1000);
    }
  }
}

// video.addEventListener('click', snapshot, false);

function startVideo() {
  navigator.getUserMedia({video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
    $('#notice').hide();

    // allow photos to be taken
    $(document).click(preSnapshot);
    $(document).keyup(function(e){
      // console.log("e", e.keyCode);
      if(e.keyCode == 32){
        // user has pressed space
        preSnapshot(); // take the picture
      }
    });
  }, onFailSoHard);
}

function onFailSoHard(err) {
  alert("You need to allow dat vid, dawg.")
  startVideo();
}

var socket = io.connect('http://localhost');
socket.on('startPhoto', function () {
  withPhysicalToken = true;
  preSnapshot(); // take the picture
});

socket.on('savedPhoto', function (data) {
  console.log("saved", data);
  $('#saveMessage').text(data.message);
  $('#savedPhoto').show();
  $('#savedPhoto').fadeOut(4000);
});

