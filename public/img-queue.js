var imgQ = function (anchor, display){
  this.anchor = anchor;
  this.display = display;
  this.imgs = [];
}

imgQ.prototype.add = function (dataURI){
  // add an image to the anchor
  var thumbnail = new thumbnailImg(dataURI, parentQ);
  this.anchor.append(thumbnail);
  this.imgs.push(thumbnail);
  // this image is the currently displayed image
  this.display.attr("src", dataURI);
}

imgQ.prototype.post = function (){
  // post the currently displayed image to facebook
}

imgQ.prototype.postAll = function (){
  // post a series of images to facebook
}

imgQ.prototype.changeHighlight = function (){
  this.imgs.forEach(function (img) {
    img.removeClass('highlighted');
  })
}

imgQ.prototype.display = function (dataURI){
  this.display.attr("src", dataURI);
}

var thumbnailImg = function (dataURI, parentQ) {
  // image on the thumbnail
  this.imgURI = dataURI;
  this.parent = parentQ;

  this.ele = $('<img>').attr('src', this.imgURI);
  this.ele.click(qClick);

  return this.ele;
}

thumbnailImg.prototype.qClick = function () {
  // occurs when the thumbnail is clicked

  // display this image on the parent display
  this.parent.changeHighlight();
  this.ele.addClass('highlighted');
  this.parent.display(this.imgURI);
}