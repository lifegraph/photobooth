window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia || navigator.msGetUserMedia;
var video = document.querySelector('video');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;

function snapshot() {
  ctx.width = video.width;
  if (localMediaStream) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    // "image/webp" works in Chrome 18. In other browsers, this will fall back to image/png.
    var datauri = canvas.toDataURL('image/png');
    document.querySelector('img').src = datauri;
    $.post('/upload', {datauri: datauri}, function (data) {
      console.log(data);
    });
  }
}

video.addEventListener('click', snapshot, false);


function startVideo() {
  navigator.getUserMedia({video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
  }, onFailSoHard);
}

function onFailSoHard(err) {
  alert("You need to allow it, dawg.")
  startVideo();
}

startVideo();

var socket = io.connect('http://localhost');
socket.on('startPhoto', function () {
  video.click();
});