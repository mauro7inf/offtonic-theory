function CanvasButton(ctx) {
  this.ctx = ctx;
}

// should override these to provide functionality
CanvasButton.prototype.onMouseDown = function () {};
CanvasButton.prototype.onMouseUp = function () {};

CanvasButton.prototype.distance = function (x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2));
};

function CanvasRoundedRectButton(x, y, w, h, r, ctx) {
  this.base = CanvasButton;
  this.base(ctx);
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.r = r;
  this.borderWidth = 2;
  this.strokeStyle = 'rgb(128, 128, 255)';
  this.fillStyle = 'rgb(255, 255, 255)';
}
CanvasRoundedRectButton.prototype = new CanvasButton;

CanvasRoundedRectButton.prototype.isInButton = function (x, y) {
  let r = this.r;
  let s = this.borderWidth/2;
  // check that it's in the rectangle
  if (x < this.x - s || x > this.x + this.w + s || y < this.y - s || y > this.y + this.h + s) {
    return false;
  }
  // check if it's in the interior cross (not in the corner squares)
  if ((x >= this.x + r - s && x <= this.x + this.w - r + s) || (y >= this.y + r - s && y <= this.y + this.h - r + s)) {
    return true;
  }
  // check if it's in the corners
  if (this.distance(x, y, this.x, this.y) < r - s || this.distance(x, y, this.x, this.y + this.h) < r - s ||
    this.distance(x, y, this.x + this.w, this.y) < r - s || this.distance(x, y, this.x + this.w, this.y + this.h) < r - s) {
    return false;
  }
  return true;
};

CanvasRoundedRectButton.prototype.draw = function () {
  let ctx = this.ctx;

  ctx.strokeStyle = this.strokeStyle;
  ctx.fillStyle = this.fillStyle;
  ctx.lineWidth = this.borderWidth;

  ctx.beginPath();
  ctx.moveTo(this.x, this.y + this.r);
  ctx.lineTo(this.x, this.y + this.h - this.r);
  ctx.arc(this.x + this.r, this.y + this.h - this.r, this.r, Math.PI, Math.PI/2, true);
  ctx.lineTo(this.x + this.w - this.r, this.y + this.h);
  ctx.arc(this.x + this.w - this.r, this.y + this.h - this.r, this.r, Math.PI/2, 0, true);
  ctx.lineTo(this.x + this.w, this.y + this.r);
  ctx.arc(this.x + this.w - this.r, this.y + this.r, this.r, 0, 3*Math.PI/2, true);
  ctx.lineTo(this.x + this.r, this.y);
  ctx.arc(this.x + this.r, this.y + this.r, this.r, 3*Math.PI/2, Math.PI, true);
  ctx.fill();
  ctx.stroke();
};