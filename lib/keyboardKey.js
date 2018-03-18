// Dependencies: tone.js

function KeyboardKey(frequency, computerKey) {
  this.frequency = frequency;
  this.computerKey = computerKey;
  this.active = false;
  this.activeColor = this.getActiveColor();
  this.keyboard = null;
  this.note = null;
  this.noteNames = true;
}

KeyboardKey.prototype.getActiveColor = function () {
  let octavesAboveC0 = Math.log(this.frequency/C0)/(Math.log(2)); // octave-based
  let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
  return 'hsla(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%, 0.5)';
};

KeyboardKey.prototype.play = function () {
  if (this.active) {
    return; // it's already active
  }
  this.active = true;
  this.draw();
  let note = new Tone(this.frequency, -1, 0.1);
  note.setFormula('sawtooth5');
  note.play();
  this.note = note;
};

KeyboardKey.prototype.stop = function () {
  this.active = false;
  this.draw();
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
};

KeyboardKey.prototype.setKeyboard = function (keyboard) {
  this.keyboard = keyboard;
};

// lines = {top, middle, bottom}
// top = {left, right}
// bottom = {left, right}; top interval should be a subset of bottom interval
function WhiteKey(lines, top, bottom, frequency, name, computerKey) {
  this.base = KeyboardKey;
  this.base(frequency, computerKey);
  this.lines = lines;
  this.top = top;
  this.bottom = bottom;
  this.name = name;
  this.color = 'rgb(224, 224, 224)';
  this.textColor = 'rgb(32, 32, 32)';
  this.keyType = 'WhiteKey';
}
WhiteKey.prototype = new KeyboardKey;

WhiteKey.prototype.draw = function () {
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

  if (this.computerKey !== null) {
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.computerKey, (this.bottom.left + this.bottom.right)/2, this.lines.bottom - 12);
  }

  if (this.noteNames) {
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.name, (this.top.left + this.top.right)/2, this.lines.top + 30);
  }

  if (this.name === 'C4') {
    // red line on middle C
    ctx.beginPath();
    ctx.arc((this.top.left + this.top.right)/2, this.lines.top + 10, 3, 0, 2*Math.PI, true);
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.fill();
  }
};

// black keys are rectangular; no need for bottom
// name1 and name2 are something like C# and Db
function BlackKey(lines, top, frequency, name1, name2, computerKey) {
  this.base = KeyboardKey;
  this.base(frequency, computerKey);
  this.lines = lines;
  this.top = top;
  this.name1 = name1;
  this.name2 = name2;
  this.color = 'rgb(32, 32, 32)';
  this.textColor = 'rgb(224, 224, 224)';
  this.keyType = 'BlackKey';
}
BlackKey.prototype = new KeyboardKey;

BlackKey.prototype.draw = function () {
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

  if (this.computerKey !== null) {
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.computerKey, (this.top.left + this.top.right)/2, this.lines.middle - 12);
  }

  if (this.noteNames) {
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.name1, (this.top.left + this.top.right)/2, this.lines.top + 20);
    ctx.fillText(this.name2, (this.top.left + this.top.right)/2, this.lines.top + 40);
  }
};

// bounds is object with top, bottom, left, right; key is rectangle
function ScaleKey(bounds, frequency, name, computerKey, row, color, textColor) {
  this.base = KeyboardKey;
  this.base(frequency, computerKey);
  this.bounds = bounds;
  this.name = name;
  this.row = row;
  this.color = color;
  this.textColor = textColor;
  this.smallName = false;
  this.keyType = 'ScaleKey';
}
ScaleKey.prototype = new KeyboardKey;

ScaleKey.prototype.setWhite = function () {
  this.color = 'rgb(224, 224, 224)';
  this.textColor = 'rgb(32, 32, 32)';
};

ScaleKey.prototype.setLight = function () {
  this.color = 'rgb(192, 192, 192)';
  this.textColor = 'rgb(32, 32, 32)';
};

ScaleKey.prototype.setGray = function () {
  this.color = 'rgb(112, 112, 112)';
  this.textColor = 'rgb(32, 32, 32)';
};

ScaleKey.prototype.setGrey = function () {
  this.color = 'rgb(144, 144, 144)';
  this.textColor = 'rgb(224, 224, 224)';
};

ScaleKey.prototype.setDark = function () {
  this.color = 'rgb(64, 64, 64)';
  this.textColor = 'rgb(224, 224, 224)';
};

ScaleKey.prototype.setBlack = function () {
  this.color = 'rgb(32, 32, 32)';
  this.textColor = 'rgb(224, 224, 224)';
};

ScaleKey.prototype.setSmallName = function () {
  this.smallName = true;
};

ScaleKey.prototype.draw = function () {
  if (this.keyboard === null) {
    return;
  }
  let ctx = this.keyboard.ctx;
  ctx.beginPath();
  ctx.moveTo(this.bounds.left, this.bounds.top);
  ctx.lineTo(this.bounds.right, this.bounds.top);
  ctx.lineTo(this.bounds.right, this.bounds.bottom);
  ctx.lineTo(this.bounds.left, this.bounds.bottom);
  ctx.lineTo(this.bounds.left, this.bounds.top);
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

  if (this.computerKey !== null) {
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.computerKey, (this.bounds.left + this.bounds.right)/2, this.bounds.bottom - 12);
  }

  if (this.noteNames) {
    if (!this.smallName) {
      ctx.font = '16px serif';
    } else {
      ctx.font = '12px serif';
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    if (!this.smallName) {
      ctx.fillText(this.name, (this.bounds.left + this.bounds.right)/2, this.bounds.top + 30);
    } else {
      ctx.fillText(this.name, (this.bounds.left + this.bounds.right)/2, this.bounds.top + 20);
    }
  }
};

// top and bottom look like this: {left: {r:, t:}, right: {r:, t:}, type:}
// type can be 'arc', which requires left and right to have the same r, or 'line'
function CircleKey(top, bottom, frequency, name, computerKey) {
  this.base = KeyboardKey;
  this.base(frequency, computerKey);
  this.top = top;
  this.bottom = bottom;
  this.tl = null;
  this.tr = null;
  this.bl = null;
  this.br = null;
  this.center = null;
  this.name = name;
  this.nameFont = '40px serif';
  this.computerKeyFont = '24px serif';
  this.color = 'rgb(224, 224, 224)';
  this.textColor = 'rgb(32, 32, 32)';
  this.keyType = 'CircleKey';
}
CircleKey.prototype = new KeyboardKey;

CircleKey.prototype.setKeyboard = function (keyboard) {
  this.keyboard = keyboard;
  this.tl = this.keyboard.polarToRectangular(this.top.left.r, this.top.left.t);
  this.tr = this.keyboard.polarToRectangular(this.top.right.r, this.top.right.t);
  this.bl = this.keyboard.polarToRectangular(this.bottom.left.r, this.bottom.left.t);
  this.br = this.keyboard.polarToRectangular(this.bottom.right.r, this.bottom.right.t);
  let centerR = (1.0/4.0)*(this.top.left.r + this.top.right.r + this.bottom.left.r + this.bottom.right.r);
  let centerT = (1.0/4.0)*(this.top.left.t + this.top.right.t + this.bottom.left.t + this.bottom.right.t);
  this.center = this.keyboard.polarToRectangular(centerR, centerT);
  let lowerR = (1.0/3.0)*(centerR + this.bottom.right.r + this.bottom.left.r);
  let lowerT = (1.0/3.0)*(centerT + 2*this.bottom.right.t);
  this.lowerCenter = this.keyboard.polarToRectangular(lowerR, lowerT);
};

CircleKey.prototype.makeWhite = function () {
  this.nameFont = '40px serif';
  this.computerKeyFont = '24px serif';
  this.color = 'rgb(224, 224, 224)';
  this.textColor = 'rgb(32, 32, 32)';
  this.keyType = 'CircleKey';
};

CircleKey.prototype.makeBlack = function () {
  this.nameFont = '20px serif';
  this.computerKeyFont = '12px serif';
  this.color = 'rgb(32, 32, 32)';
  this.textColor = 'rgb(224, 224, 224)';
  this.keyType = 'CircleBlackKey';
}

CircleKey.prototype.draw = function () {
  if (this.keyboard === null) {
    return;
  }
  let ctx = this.keyboard.ctx;
  ctx.beginPath();
  ctx.moveTo(this.tl.x, this.tl.y);
  if (this.top.type === 'line') {
    ctx.lineTo(this.tr.x, thix.tr.y);
  } else if (this.top.type === 'arc') {
    ctx.arc(this.keyboard.center.x, this.keyboard.center.y, this.top.left.r, -this.top.left.t, -this.top.right.t, false);
  }
  ctx.lineTo(this.br.x, this.br.y);
  if (this.bottom.type === 'line') {
    ctx.lineTo(this.bl.x, this.bl.y);
  } else if (this.bottom.type === 'arc') {
    ctx.arc(this.keyboard.center.x, this.keyboard.center.y, this.bottom.right.r, -this.bottom.right.t, -this.bottom.left.t, true);
  }
  ctx.lineTo(this.tl.x, this.tl.y);
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

  if (this.name) {
    // assume full key
    ctx.font = this.nameFont;
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    if (this.type === 'CircleKey') {
      ctx.fillText(this.name, this.center.x, this.center.y + 12);
    } else {
      let components = this.name.split('\n');
      if (components.length === 1) {
        ctx.fillText(this.name, this.center.x, this.center.y + 4);
      } else if (components.length === 2) {
        ctx.fillText(components[0], this.center.x, this.center.y - 4);
        ctx.fillText(components[1], this.center.x, this.center.y + 18);
      }
    }

    // debug where the center is
    //ctx.fillStyle = 'rgb(255,0,0)';
    //ctx.fillRect(this.center.x - 4, this.center.y - 4, 8, 8);
  }

  if (this.computerKey) {
    // assume full key
    ctx.font = this.computerKeyFont;
    ctx.textAlign = 'center';
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.computerKey, this.lowerCenter.x, this.lowerCenter.y + 6);

    // debug where the lower center is
    //ctx.fillStyle = 'rgb(255,0,0)';
    //ctx.fillRect(this.lowerCenter.x - 2, this.lowerCenter.y - 2, 4, 4);
  }
};

CircleKey.prototype.play = function () {
  if (this.active) {
    return; // it's already active
  }
  this.active = true;
  this.draw();
  let note = new Tone(this.frequency, -1, 0.1);
  note.setFormula('shepard');
  note.play();
  this.note = note;
};