// canvas should have the correct dimensions: 800x280
function IntervalKeyboardDiagram(canvas, interval) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.whiteKeys = [];
  this.blackKeys = [];

  this.interval = interval;

  this.bottomRow = {
    top: this.canvas.height - 195,
    middle: this.canvas.height - 80,
    bottom: this.canvas.height - 10
  };

  this.initKeys(); // needs row info
}

IntervalKeyboardDiagram.prototype.draw = function () {
  let ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(800, 0);
  ctx.lineTo(800, 400);
  ctx.lineTo(0, 400);
  ctx.lineTo(0, 0);
  ctx.closePath();
  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillStyle = 'rgb(192, 192, 192)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fill();
  for (let i = 0; i < this.whiteKeys.length; i++) {
    this.whiteKeys[i].draw();
  }
  for (let i = 0; i < this.blackKeys.length; i++) {
    this.blackKeys[i].draw();
  }

  if (this.interval > 0) {
    for (let i = 0; i + this.interval - 1 < this.whiteKeys.length; i++) {
      this.connect(this.whiteKeys[i], this.whiteKeys[i + this.interval - 1], this.interval);
    }
  } else {
    for (let i = 0; i < this.whiteKeys.length - 1; i++) {
      this.drawDotAbove(this.whiteKeys[i]);
    }
    for (let j = 2; j <= 8; j++) {
      for (let i = 0; i + j - 1 < this.whiteKeys.length - 1; i++) {
        this.connect(this.whiteKeys[i], this.whiteKeys[i + j - 1], j);
      }
    }
  }
};

IntervalKeyboardDiagram.prototype.drawDotAbove = function (key) {
  let ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(key.centerTop.x, key.centerTop.y);
  ctx.lineTo(key.centerTop.x, key.centerTop.y - 2);
  ctx.strokeStyle = 'rgb(255, 0, 0)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

IntervalKeyboardDiagram.prototype.connect = function (key1, key2, intervalType) {
  // assume centerTop.y is the same for all notes
  let center = {
    x: (key1.centerTop.x + key2.centerTop.x)*0.5,
    y: key1.centerTop.y
  };
  let r = (key2.centerTop.x - key1.centerTop.x)*0.5 + 2*intervalType - 2;

  let interval = intervalName(key1.name, key2.name);
  let h;
  if (this.interval > 0) {
    if (['m2', 'm3', 'm6', 'm7'].indexOf(interval) !== -1) {
      h = 40;
    } else if (['M2', 'M3', 'M6', 'M7'].indexOf(interval) !== -1) {
      h = 60;
    } else if (['P4', 'P5', 'P8'].indexOf(interval) !== -1) {
      h = 50;
    } else if (interval === 'd5') {
      h = 30;
    } else if (interval === 'A4') {
      h = 70;
    }
  } else {
    h = r;
  }

  let color;
  switch (interval) {
    case 'm2':
      color = 'rgb(255, 128, 0)';
      break;
    case 'M2':
      color = 'rgb(255, 255, 0)';
      break;
    case 'm3':
      color = 'rgb(128, 255, 0)';
      break;
    case 'M3':
      color = 'rgb(0, 255, 0)';
      break;
    case 'P4':
      color = 'rgb(0, 255, 128)';
      break;
    case 'A4':
    case 'd5':
      color = 'rgb(0, 255, 255)';
      break;
    case 'P5':
      color = 'rgb(0, 128, 255)';
      break;
    case 'm6':
      color = 'rgb(0, 0, 255)';
      break;
    case 'M6':
      color = 'rgb(128, 0, 255)';
      break;
    case 'm7':
      color = 'rgb(255, 0, 255)';
      break;
    case 'M7':
      color = 'rgb(255, 0, 128)';
      break;
    case 'P8':
      color = 'rgb(255, 0, 0)';
      break;
  }

  let ctx = this.ctx;
  ctx.beginPath();
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.scale(1, h/r);
  ctx.arc(0, 0, r, Math.PI, 0, false);
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
};

IntervalKeyboardDiagram.prototype.initKeys = function () {
  let bottomRow = this.bottomRow;

  const left = 10;
  const right = this.canvas.width - 10;
  const whiteWidth = (right - left)/15.0;
  const blackWidth = (right - left - whiteWidth)/24.0;
  const octaveWidth = 7*whiteWidth;
  const thirdWidth = 3*whiteWidth;
  const fourthWidth = 4*whiteWidth;
  const tenthWidth = octaveWidth + thirdWidth;
  const thirdTopWidth = (thirdWidth - 2*blackWidth)/3;
  const fourthTopWidth = (fourthWidth - 3*blackWidth)/4;

  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left, right: left + thirdTopWidth},
      {left: left + 0*whiteWidth, right: left + 1*whiteWidth},
      'C2'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + thirdTopWidth, right: left + thirdTopWidth + blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + blackWidth},
      {left: left + 1*whiteWidth, right: left + 2*whiteWidth},
      'D2'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + 2*thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + 2*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + 2*thirdTopWidth + 2*blackWidth, right: left + thirdWidth},
      {left: left + 2*whiteWidth, right: left + 3*whiteWidth},
      'E2'
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + thirdWidth, right: left + thirdWidth + fourthTopWidth},
      {left: left + 3*whiteWidth, right: left + 4*whiteWidth},
      'F2'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + thirdWidth + fourthTopWidth, right: left + thirdWidth + fourthTopWidth + blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + thirdWidth + fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 4*whiteWidth, right: left + 5*whiteWidth},
      'G2'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + thirdWidth + 2*fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 5*whiteWidth, right: left + 6*whiteWidth},
      'A2'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth, right: left + octaveWidth},
      {left: left + 6*whiteWidth, right: left + 7*whiteWidth},
      'B2'
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + octaveWidth, right: left + octaveWidth + thirdTopWidth},
      {left: left + 7*whiteWidth, right: left + 8*whiteWidth},
      'C3'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + octaveWidth + thirdTopWidth, right: left + octaveWidth + thirdTopWidth + blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + octaveWidth + thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + blackWidth},
      {left: left + 8*whiteWidth, right: left + 9*whiteWidth},
      'D3'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + octaveWidth + 2*thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth, right: left + tenthWidth},
      {left: left + 9*whiteWidth, right: left + 10*whiteWidth},
      'E3'
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + tenthWidth, right: left + tenthWidth + fourthTopWidth},
      {left: left + 10*whiteWidth, right: left + 11*whiteWidth},
      'F3'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + tenthWidth + fourthTopWidth, right: left + tenthWidth + fourthTopWidth + blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + tenthWidth + fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 11*whiteWidth, right: left + 12*whiteWidth},
      'G3'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + tenthWidth + 2*fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 12*whiteWidth, right: left + 13*whiteWidth},
      'A3'
    )
  );
  this.addKey(
    new BlackDiagramKey(
      bottomRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth}
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth, right: left + 2*octaveWidth},
      {left: left + 13*whiteWidth, right: left + 14*whiteWidth},
      'B3'
    )
  );
  this.addKey(
    new WhiteDiagramKey(
      bottomRow,
      {left: left + 2*octaveWidth, right: right},
      {left: left + 14*whiteWidth, right: right},
      'C4'
    )
  );
}

IntervalKeyboardDiagram.prototype.addKey = function (key) {
  key.keyboard = this;
  if (key.keyType === 'WhiteDiagramKey') {
    this.whiteKeys.push(key);
  } else if (key.keyType === 'BlackDiagramKey') {
    this.blackKeys.push(key);
  }
};

// lines = {top, middle, bottom}
// top = {left, right}
// bottom = {left, right}; top interval should be a subset of bottom interval
function WhiteDiagramKey(lines, top, bottom, name) {
  this.lines = lines;
  this.top = top;
  this.centerTop = this.getCenterTop();
  this.bottom = bottom;
  this.name = name;
  this.color = 'rgb(224, 224, 224)';
  this.keyType = 'WhiteDiagramKey';
  this.keyboard = null;
}

WhiteDiagramKey.prototype.draw = function () {
  if (this.keyboard === null) {
    return;
  }
  let ctx = this.keyboard.ctx;
  ctx.beginPath();
  ctx.moveTo(this.top.left, this.lines.top);
  ctx.lineTo(this.top.right, this.lines.top);
  ctx.lineTo(this.top.right, this.lines.middle);
  ctx.lineTo(this.bottom.right, this.lines.middle);
  ctx.lineTo(this.bottom.right, this.lines.bottom);
  ctx.lineTo(this.bottom.left, this.lines.bottom);
  ctx.lineTo(this.bottom.left, this.lines.middle);
  ctx.lineTo(this.top.left, this.lines.middle);
  ctx.lineTo(this.top.left, this.lines.top);
  ctx.closePath();
  ctx.fillStyle = this.color;
  ctx.fill();
  if (this.active) {
    ctx.fillStyle = this.activeColor;
    ctx.fill();
  }
  ctx.strokeStyle = 'rgb(0,0,0)';
  ctx.lineWidth = 3;
  ctx.stroke();
};

WhiteDiagramKey.prototype.getCenterTop = function () {
  return {
    x: 0.5*(this.top.left + this.top.right),
    y: this.lines.top - 5
  };
};

// black keys are rectangular; no need for bottom
// name1 and name2 are something like C# and Db
function BlackDiagramKey(lines, top) {
  this.lines = lines;
  this.top = top;
  this.color = 'rgb(32, 32, 32)';
  this.keyType = 'BlackDiagramKey';
}

BlackDiagramKey.prototype.draw = function (opts) {
  if (this.keyboard === null) {
    return;
  }
  let ctx = this.keyboard.ctx;
  ctx.beginPath();
  ctx.moveTo(this.top.left, this.lines.top);
  ctx.lineTo(this.top.right, this.lines.top);
  ctx.lineTo(this.top.right, this.lines.middle);
  ctx.lineTo(this.top.left, this.lines.middle);
  ctx.lineTo(this.top.left, this.lines.top);
  ctx.closePath();
  ctx.fillStyle = this.color;
  ctx.fill();
  if (this.active) {
    ctx.fillStyle = this.activeColor;
    ctx.fill();
  }
  ctx.strokeStyle = 'rgb(0,0,0)';
  ctx.lineWidth = 3;
  ctx.stroke();
}