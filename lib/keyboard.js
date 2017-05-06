// canvas should have the correct dimensions: 800x400
function Keyboard(canvas) {
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.keys = [];

  this.bottomRow = {
    top: 205,
    middle: 320,
    bottom: 390
  };
  this.topRow = {
    top: 10,
    middle: 125,
    bottom: 195
  };

  this.initKeys(); // needs row info
}

Keyboard.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

Keyboard.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].stop();
  }
  this.draw();
};

Keyboard.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
  // canvas won't receive keyboard events anyway, so get them in the document and route them to the active keyboard
};

Keyboard.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let key = this.getKeyFromClick(x, y);
  if (key !== null) {
    key.play();
  }
};

Keyboard.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let key = this.getKeyFromClick(x, y);
  if (key !== null) {
    key.stop();
  }
};

Keyboard.prototype.onKeyDown = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.play();
  }
};

Keyboard.prototype.onKeyUp = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.stop();
  }
};

Keyboard.prototype.draw = function () {
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
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fill();
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].draw();
  }
};

Keyboard.prototype.getKeyFromClick = function(x, y) {
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.keyType === 'WhiteKey') {
      if (key.lines.top < y && key.lines.middle > y) {
        if (key.top.left < x && key.top.right > x) {
          return key;
        }
      } else if (key.lines.middle < y && key.lines.bottom > y) {
        if (key.bottom.left < x && key.bottom.right > x) {
          return key;
        }
      } else if (key.lines.middle === y) {
        if (key.top.left < x && key.bottom.left < x && key.top.right > x && key.bottom.right > x) {
          return key;
        }
      }
    } else if (key.keyType === 'BlackKey') {
      if (key.lines.top < y && key.lines.middle > y && key.top.left < x && key.top.right > x) {
        return key;
      }
    }
  }
  return null;
};

Keyboard.prototype.getKeyFromComputerKey = function(computerKey) {
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.computerKey !== null && key.computerKey === computerKey) {
      return key;
    }
  }
  return null;
}

Keyboard.prototype.initKeys = function () {
  initNotes12TET(); // we're assuming, yeah

  let bottomRow = this.bottomRow;
  let topRow = this.topRow;

  const left = 10;
  const right = 790;
  const whiteWidth = (right - left)/15.0;
  const blackWidth = (right - left - whiteWidth)/24.0;
  const octaveWidth = 7*whiteWidth;
  const thirdWidth = 3*whiteWidth;
  const fourthWidth = 4*whiteWidth;
  const tenthWidth = octaveWidth + thirdWidth;
  const thirdTopWidth = (thirdWidth - 2*blackWidth)/3;
  const fourthTopWidth = (fourthWidth - 3*blackWidth)/4;

  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left, right: left + thirdTopWidth},
      {left: left + 0*whiteWidth, right: left + 1*whiteWidth},
      Notes['C2'],
      'C2',
      null
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + thirdTopWidth, right: left + thirdTopWidth + blackWidth},
      Notes['C#2'],
      'C#2',
      'Db2',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + blackWidth},
      {left: left + 1*whiteWidth, right: left + 2*whiteWidth},
      Notes['D2'],
      'D2',
      null
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + 2*thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + 2*blackWidth},
      Notes['D#2'],
      'D#2',
      'Eb2',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + 2*thirdTopWidth + 2*blackWidth, right: left + thirdWidth},
      {left: left + 2*whiteWidth, right: left + 3*whiteWidth},
      Notes['E2'],
      'E2',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + thirdWidth, right: left + thirdWidth + fourthTopWidth},
      {left: left + 3*whiteWidth, right: left + 4*whiteWidth},
      Notes['F2'],
      'F2',
      null
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + thirdWidth + fourthTopWidth, right: left + thirdWidth + fourthTopWidth + blackWidth},
      Notes['F#2'],
      'F#2',
      'Gb2',
      'a'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + thirdWidth + fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 4*whiteWidth, right: left + 5*whiteWidth},
      Notes['G2'],
      'G2',
      'z'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + thirdWidth + 2*fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth},
      Notes['G#2'],
      'G#2',
      'Ab2',
      's'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 5*whiteWidth, right: left + 6*whiteWidth},
      Notes['A2'],
      'A2',
      'x'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth},
      Notes['A#2'],
      'A#2',
      'Bb2',
      'd'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth, right: left + octaveWidth},
      {left: left + 6*whiteWidth, right: left + 7*whiteWidth},
      Notes['B2'],
      'B2',
      'c'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + octaveWidth, right: left + octaveWidth + thirdTopWidth},
      {left: left + 7*whiteWidth, right: left + 8*whiteWidth},
      Notes['C3'],
      'C3',
      'v'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + octaveWidth + thirdTopWidth, right: left + octaveWidth + thirdTopWidth + blackWidth},
      Notes['C#3'],
      'C#3',
      'Db3',
      'g'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + octaveWidth + thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + blackWidth},
      {left: left + 8*whiteWidth, right: left + 9*whiteWidth},
      Notes['D3'],
      'D3',
      'b'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + octaveWidth + 2*thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth},
      Notes['D#3'],
      'D#3',
      'Eb3',
      'h'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth, right: left + tenthWidth},
      {left: left + 9*whiteWidth, right: left + 10*whiteWidth},
      Notes['E3'],
      'E3',
      'n'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + tenthWidth, right: left + tenthWidth + fourthTopWidth},
      {left: left + 10*whiteWidth, right: left + 11*whiteWidth},
      Notes['F3'],
      'F3',
      'm'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + tenthWidth + fourthTopWidth, right: left + tenthWidth + fourthTopWidth + blackWidth},
      Notes['F#3'],
      'F#3',
      'Gb3',
      'k'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + tenthWidth + fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 11*whiteWidth, right: left + 12*whiteWidth},
      Notes['G3'],
      'G3',
      ','
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + tenthWidth + 2*fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth},
      Notes['G#3'],
      'G#3',
      'Ab3',
      'l'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 12*whiteWidth, right: left + 13*whiteWidth},
      Notes['A3'],
      'A3',
      '.'
    )
  );
  this.addKey(
    new BlackKey(
      bottomRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth},
      Notes['A#3'],
      'A#3',
      'Bb3',
      ';'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth, right: left + 2*octaveWidth},
      {left: left + 13*whiteWidth, right: left + 14*whiteWidth},
      Notes['B3'],
      'B3',
      '/'
    )
  );
  this.addKey(
    new WhiteKey(
      bottomRow,
      {left: left + 2*octaveWidth, right: right},
      {left: left + 14*whiteWidth, right: right},
      Notes['C4'],
      'C4',
      null
    )
  );

    this.addKey(
    new WhiteKey(
      topRow,
      {left: left, right: left + thirdTopWidth},
      {left: left + 0*whiteWidth, right: left + 1*whiteWidth},
      Notes['C4'],
      'C4',
      'q'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + thirdTopWidth, right: left + thirdTopWidth + blackWidth},
      Notes['C#4'],
      'C#4',
      'Db4',
      '2'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + blackWidth},
      {left: left + 1*whiteWidth, right: left + 2*whiteWidth},
      Notes['D4'],
      'D4',
      'w'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + 2*thirdTopWidth + blackWidth, right: left + 2*thirdTopWidth + 2*blackWidth},
      Notes['D#4'],
      'D#4',
      'Eb4',
      '3'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + 2*thirdTopWidth + 2*blackWidth, right: left + thirdWidth},
      {left: left + 2*whiteWidth, right: left + 3*whiteWidth},
      Notes['E4'],
      'E4',
      'e'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + thirdWidth, right: left + thirdWidth + fourthTopWidth},
      {left: left + 3*whiteWidth, right: left + 4*whiteWidth},
      Notes['F4'],
      'F4',
      'r'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + thirdWidth + fourthTopWidth, right: left + thirdWidth + fourthTopWidth + blackWidth},
      Notes['F#4'],
      'F#4',
      'Gb4',
      '5'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + thirdWidth + fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 4*whiteWidth, right: left + 5*whiteWidth},
      Notes['G4'],
      'G4',
      't'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + thirdWidth + 2*fourthTopWidth + blackWidth, right: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth},
      Notes['G#4'],
      'G#4',
      'Ab4',
      '6'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + thirdWidth + 2*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 5*whiteWidth, right: left + 6*whiteWidth},
      Notes['A4'],
      'A4',
      'y'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 2*blackWidth, right: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth},
      Notes['A#4'],
      'A#4',
      'Bb4',
      '7'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + thirdWidth + 3*fourthTopWidth + 3*blackWidth, right: left + octaveWidth},
      {left: left + 6*whiteWidth, right: left + 7*whiteWidth},
      Notes['B4'],
      'B4',
      'u'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + octaveWidth, right: left + octaveWidth + thirdTopWidth},
      {left: left + 7*whiteWidth, right: left + 8*whiteWidth},
      Notes['C5'],
      'C5',
      'i'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + octaveWidth + thirdTopWidth, right: left + octaveWidth + thirdTopWidth + blackWidth},
      Notes['C#5'],
      'C#5',
      'Db5',
      '9'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + octaveWidth + thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + blackWidth},
      {left: left + 8*whiteWidth, right: left + 9*whiteWidth},
      Notes['D5'],
      'D5',
      'o'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + octaveWidth + 2*thirdTopWidth + blackWidth, right: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth},
      Notes['D#5'],
      'D#5',
      'Eb5',
      '0'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + octaveWidth + 2*thirdTopWidth + 2*blackWidth, right: left + tenthWidth},
      {left: left + 9*whiteWidth, right: left + 10*whiteWidth},
      Notes['E5'],
      'E5',
      'p'
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + tenthWidth, right: left + tenthWidth + fourthTopWidth},
      {left: left + 10*whiteWidth, right: left + 11*whiteWidth},
      Notes['F5'],
      'F5',
      '['
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + tenthWidth + fourthTopWidth, right: left + tenthWidth + fourthTopWidth + blackWidth},
      Notes['F#5'],
      'F#5',
      'Gb5',
      '='
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + tenthWidth + fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + blackWidth},
      {left: left + 11*whiteWidth, right: left + 12*whiteWidth},
      Notes['G5'],
      'G5',
      ']'
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + tenthWidth + 2*fourthTopWidth + blackWidth, right: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth},
      Notes['G#5'],
      'G#5',
      'Ab5',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + tenthWidth + 2*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth},
      {left: left + 12*whiteWidth, right: left + 13*whiteWidth},
      Notes['A5'],
      'A5',
      null
    )
  );
  this.addKey(
    new BlackKey(
      topRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 2*blackWidth, right: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth},
      Notes['A#5'],
      'A#5',
      'Bb5',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + tenthWidth + 3*fourthTopWidth + 3*blackWidth, right: left + 2*octaveWidth},
      {left: left + 13*whiteWidth, right: left + 14*whiteWidth},
      Notes['B5'],
      'B5',
      null
    )
  );
  this.addKey(
    new WhiteKey(
      topRow,
      {left: left + 2*octaveWidth, right: right},
      {left: left + 14*whiteWidth, right: right},
      Notes['C6'],
      'C6',
      null
    )
  );
}

Keyboard.prototype.addKey = function (key) {
  key.keyboard = this;
  this.keys.push(key);
};

function KeyboardKey(frequency, computerKey) {
  this.frequency = frequency;
  this.computerKey = computerKey;
  this.active = false;
  this.activeColor = this.getActiveColor();
  this.keyboard = null;
  this.note = null;
}

KeyboardKey.prototype.getActiveColor = function () {
  let octavesAboveC0 = Math.log(this.frequency/C0)/(Math.log(2)); // octave-based
  let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
  return 'hsla(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%, 0.5)';
}

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
}

KeyboardKey.prototype.stop = function () {
  this.active = false;
  this.draw();
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
}

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

  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = this.textColor;
  ctx.fillText(this.name, (this.top.left + this.top.right)/2, this.lines.top + 30);

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

  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = this.textColor;
  ctx.fillText(this.name1, (this.top.left + this.top.right)/2, this.lines.top + 20);
  ctx.fillText(this.name2, (this.top.left + this.top.right)/2, this.lines.top + 40);
}