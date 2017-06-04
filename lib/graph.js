function Graph(canvas, f) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');

  this.backgroundColor = 'rgb(0, 0, 0)';
  this.axisColor = 'rgb(128, 128, 255)';
  this.plotColors = [
    'rgb(64, 64, 255)',
    'rgb(128, 64, 192)',
    'rgb(192, 64, 128)',
    'rgb(255, 64, 64)',
    'rgb(192, 128, 64)',
    'rgb(128, 192, 64)',
    'rgb(64, 255, 64)',
    'rgb(64, 192, 128)',
    'rgb(64, 128, 192)'
  ];

  if (typeof f === 'function') {
    this.functions = [f];
  } else {
    this.functions = f; // function to graph
  }

  this.lowx = -0.1;
  this.highx = 10.1;
  this.lowy = -1.25;
  this.highy = 1.25;
  this.n = 1600;

  this.drawAxes = true;
  this.xHash = 1;
  this.yHash = 1;
}

Graph.prototype.draw = function () {
  let ctx = this.ctx;

  // background
  ctx.fillStyle = this.backgroundColor;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  // axes
  if (this.drawAxes) {
    // y-axis
    let yBottom = this.getPoint(0, this.lowy);
    let yTop = this.getPoint(0, this.highy);
    ctx.beginPath();
    ctx.moveTo(yBottom.x, yBottom.y);
    ctx.lineTo(yTop.x, yTop.y);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // y-axis hashes
    let yHashStart = Math.ceil(this.lowy/this.yHash)*this.yHash;
    for (let y = yHashStart; y < this.highy; y += this.yHash) {
      let p = this.getPoint(0, y);
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y);
      ctx.lineTo(p.x + 3, p.y);
      ctx.strokeStyle = this.axisColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // x-axis
    let xLeft = this.getPoint(this.lowx, 0);
    let xRight = this.getPoint(this.highx, 0);
    ctx.beginPath();
    ctx.moveTo(xLeft.x, xLeft.y);
    ctx.lineTo(xRight.x, xRight.y);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // x-axis hashes
    let xHashStart = Math.ceil(this.lowx/this.xHash)*this.xHash;
    for (let x = xHashStart; x < this.highx; x += this.xHash) {
      let p = this.getPoint(x, 0);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 3);
      ctx.lineTo(p.x, p.y + 3);
      ctx.strokeStyle = this.axisColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // plot
  let stepSize = (this.highx - this.lowx)/this.n;
  for (let i = 0; i < this.functions.length; i++) {
    let f = this.functions[i];
    ctx.beginPath();
    let p0 = this.getPoint(this.lowx, f(this.lowx));
    ctx.moveTo(p0.x, p0.y);
    for (let x = this.lowx + stepSize; x <= this.highx; x += stepSize) {
      let p = this.getPoint(x, f(x));
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = this.plotColors[i];
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

// transforms a point from math coordinates to canvas coordinates
Graph.prototype.getPoint = function (x, y) {
  let cx = (x - this.lowx)*this.canvas.width/(this.highx - this.lowx);
  let cy = (y - this.highy)*this.canvas.height/(this.lowy - this.highy);
  return {
    x: cx,
    y: cy
  };
};