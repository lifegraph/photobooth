
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia || navigator.msGetUserMedia;
var video;
var canvas;
var ctx;
var localMediaStream = null;
var withPhysicalToken = false;
var currentCountdownTimer = null;
var videoStarted = false;

var allowCameraText = "^ Click 'Allow' up there ^";

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
  $('#saveMessage').html(allowCameraText);
  $('#savedPhoto').show();
  fadeOutAndInMessage();
  startVideo();
});

function fadeOutAndInMessage() {
  if (!videoStarted) {
    $('#savedPhoto').fadeOut(2000, function(){
      if (!videoStarted) {
        $('#saveMessage').html(allowCameraText);
        $(this).fadeIn(2000, fadeOutAndInMessage);
      } else {
        $('#savedPhoto').unbind();
      }
    });
  } else {
    $('#savedPhoto').unbind();
  }
}

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
  if (!videoStarted) {
    $('#saveMessage').html("Press 'Allow' in the bar above first!");
    $('#savedPhoto').show();
    $('#savedPhoto').fadeOut(6000);
    return;
  }
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
    videoStarted = true;

    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
    $('#notice').hide();
    $('#savedPhoto').hide();

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

socket.on('pidError', function (errcode) {
  if (errcode == 404) { // not bound
    $('#saveMessage').html("Sync your card at <a href= \"http://lifegraphconnect.com\">http://lifegraphconnect.com</a>");
    $('#savedPhoto').show();
    $('#savedPhoto').fadeOut(6000);
  } else if (errcode == 406) { // not authed
    $('#saveMessage').html("Grant access to Photo Booth at <a href= \"http://lifegraphconnect.com\" style=\"font-size:20px\">http://lifegraphconnect.com</a>");
    $('#savedPhoto').show();
    $('#savedPhoto').fadeOut(6000);
  }
})

