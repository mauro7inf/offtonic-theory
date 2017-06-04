// canvas is 1600x1600
function ColorWheel(canvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
}

ColorWheel.prototype.draw = function () {
  let ctx = this.ctx;

  let n = 720.0;
  let di = 360.0/n;
  let d = 0.25;
  for (let i = 0; i < 360; i += di) {
    ctx.beginPath();
    ctx.moveTo(800, 800);
    ctx.lineTo(800 + 800*Math.sin((i - di/2 - d)*Math.PI/180), 800 - 800*Math.cos((i - di/2 - d)*Math.PI/180));
    ctx.arc(800, 800, 800, (i - di/2 - d - 90)*Math.PI/180, (i + di/2 + d - 90)*Math.PI/180, false);
    ctx.lineTo(800, 800);
    ctx.closePath();
    ctx.fillStyle = 'hsl(' + i + ', 100%, 50%)';
    ctx.fill();
  }
}