// canvas should have the correct dimensions: 800x800
function IntervalOrgan(canvas) {
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.noteH = null;
  this.noteV = null;

  this.marginTop = 10;
  this.marginBottom = this.canvas.height - 38;
  this.marginLeft = 38;
  this.marginRight = this.canvas.width - 10;

  this.freqLeft = 4*C0; // C2
  this.freqRight = 64*C0; // C6
  this.freqBottom = 4*C0;
  this.freqTop = 64*C0;
  this.octaveRight = Math.log(this.freqRight/this.freqLeft)/Math.log(2);
  this.octaveTop = Math.log(this.freqTop/this.freqBottom)/Math.log(2);
  this.noteHPositions = [];
  this.noteVPositions = [];
  this.setupNoteHPositions();
  this.setupNoteVPositions();

  this.colorHGradient = null;
  this.colorVGradient = null;
  this.setupGradients();
}

IntervalOrgan.prototype.freqToX = function (freq) {
  if (freq < this.freqLeft || freq > this.freqRight) {
    return null;
  }
  let octave = Math.log(freq/this.freqLeft)/Math.log(2);
  return this.marginLeft + (octave/this.octaveRight)*(this.marginRight - this.marginLeft);
};

IntervalOrgan.prototype.xToFreq = function (x) {
  if (x < this.marginLeft || x > this.marginRight) {
    return null;
  }
  let octave = ((x - this.marginLeft)/(this.marginRight - this.marginLeft))*this.octaveRight;
  return Math.pow(2, octave)*this.freqLeft;
};

IntervalOrgan.prototype.freqToY = function (freq) {
  if (freq < this.freqBottom || freq > this.freqTop) {
    return null;
  }
  let octave = Math.log(freq/this.freqBottom)/Math.log(2);
  return this.marginBottom - (octave/this.octaveTop)*(this.marginBottom - this.marginTop);
};

IntervalOrgan.prototype.yToFreq = function (y) {
  if (y < this.marginTop || y > this.marginBottom) {
    return null;
  }
  let octave = ((this.marginBottom - y)/(this.marginBottom - this.marginTop))*this.octaveTop;
  return Math.pow(2, octave)*this.freqBottom;
};

IntervalOrgan.prototype.setupNoteHPositions = function () {
  let s = Math.pow(2, 1.0/12.0);
  let f = this.freqLeft;
  this.noteHPositions.push({
    name: 'C2',
    color: 'white',
    freq: f,
    x: this.marginLeft
  });
  for (let o = 2; o < 6; o++) {
    let nf = f*s;
    this.noteHPositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.noteHPositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    f *= 2;
    this.noteHPositions.push({
      name: 'C' + (o + 1),
      color: 'white',
      freq: f,
      x: this.freqToX(f)
    });
  }
};

IntervalOrgan.prototype.setupNoteVPositions = function () {
  let s = Math.pow(2, 1.0/12.0);
  let f = this.freqLeft;
  this.noteVPositions.push({
    name: 'C2',
    color: 'white',
    freq: f,
    y: this.marginBottom
  });
  for (let o = 2; o < 6; o++) {
    let nf = f*s;
    this.noteVPositions.push({
      color: 'black',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'black',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'black',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'black',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'black',
      freq: nf,
      y: this.freqToY(nf)
    });
    nf *= s;
    this.noteVPositions.push({
      color: 'white',
      freq: nf,
      y: this.freqToY(nf)
    });
    f *= 2;
    this.noteVPositions.push({
      name: 'C' + (o + 1),
      color: 'white',
      freq: f,
      y: this.freqToY(f)
    });
  }
};

IntervalOrgan.prototype.setupGradients = function () {
  this.colorHGradient = this.ctx.createLinearGradient(this.marginLeft, (this.marginTop + this.marginBottom)/2,
    this.marginRight, (this.marginTop + this.marginBottom)/2);
  for (let i = 0; i < this.noteHPositions.length; i++) {
    let stop = (this.noteHPositions[i].x - this.marginLeft)/(this.marginRight - this.marginLeft);
    this.colorHGradient.addColorStop(stop, this.freqToColor(this.noteHPositions[i].freq, 1.0));
  }

  this.colorVGradient = this.ctx.createLinearGradient((this.marginLeft + this.marginRight)/2, this.marginBottom,
    (this.marginLeft + this.marginRight)/2, this.marginTop);
  for (let i = 0; i < this.noteVPositions.length; i++) {
    let stop = (this.marginBottom - this.noteVPositions[i].y)/(this.marginBottom - this.marginTop);
    this.colorVGradient.addColorStop(stop, this.freqToColor(this.noteVPositions[i].freq, 0.5));
  }
};

IntervalOrgan.prototype.freqToColor = function (freq, a) {
  let octavesAboveC0 = Math.log(freq/C0)/(Math.log(2)); // octave-based
  let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
  return 'hsla(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%, ' + a + ')';
};

IntervalOrgan.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

IntervalOrgan.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  if (this.note) {
    this.note.stop();
  }
  this.draw();
};

IntervalOrgan.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
  this.canvas.addEventListener('mousemove', function (e) {
    return self.onMouseMove(e);
  }, false);
};

IntervalOrgan.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.noteH !== null) {
    this.noteH.stop();
    this.noteH = null;
  }
  if (this.noteV !== null) {
    this.noteV.stop();
    this.noteV = null;
  }
  this.generateNotes(x, y);
  if (this.noteH !== null) {
    this.noteH.play();
  }
  if (this.noteV !== null) {
    this.noteV.play();
  }
};

IntervalOrgan.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.noteH !== null) {
    this.noteH.stop();
    this.noteH = null;
  }
  if (this.noteV !== null) {
    this.noteV.stop();
    this.noteV = null;
  }
};

IntervalOrgan.prototype.onMouseMove = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.noteH !== null && this.noteV !== null) {
    this.adjustNotes(x, y);
  }
};

IntervalOrgan.prototype.generateNotes = function (x, y) {
  let freqH = this.xToFreq(x);
  let freqV = this.yToFreq(y);
  let gain = 0.1;
  if (freqH === null || freqV === null) {
    gain = 0;
  }

  this.noteH = new Tone(freqH, -1, gain);
  this.noteH.setFormula('square');
  this.noteH.envelope.attack = 10;
  this.noteH.envelope.decay = 0;
  this.noteH.envelope.attackGain = 1.0;
  this.noteH.audioPlayer = this.audioPlayer;
  this.noteH.addFilter(new DelayFilter(0.4, 0.6));

  this.noteV = new Tone(freqV, -1, gain);
  this.noteV.setFormula('square');
  this.noteV.envelope.attack = 10;
  this.noteV.envelope.decay = 0;
  this.noteV.envelope.attackGain = 1.0;
  this.noteV.audioPlayer = this.audioPlayer;
  this.noteV.addFilter(new DelayFilter(0.4, 0.6));
};

IntervalOrgan.prototype.adjustNotes = function (x, y) {
  let freqH = this.xToFreq(x);
  let freqV = this.yToFreq(y);
  let gain = 0.1;
  if (freqH === null || freqV === null) {
    gain = 0;
  }
  this.noteH.frequency = freqH;
  this.noteH.gain = gain;
  this.noteV.frequency = freqV;
  this.noteV.gain = gain;
};

IntervalOrgan.prototype.draw = function () {
  let ctx = this.ctx;

  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  ctx.fillStyle = this.colorHGradient;
  ctx.fillRect(this.marginLeft, this.marginTop, this.marginRight - this.marginLeft, this.marginBottom - this.marginTop);
  ctx.fillStyle = this.colorVGradient;
  ctx.fillRect(this.marginLeft, this.marginTop, this.marginRight - this.marginLeft, this.marginBottom - this.marginTop);

  for (let i = 0; i < this.noteHPositions.length; i++) {
    ctx.beginPath();
    if (this.noteHPositions[i].name) {
      ctx.moveTo(this.noteHPositions[i].x, this.marginTop);
    } else {
      ctx.moveTo(this.noteHPositions[i].x, this.marginBottom);
    }
    ctx.lineTo(this.noteHPositions[i].x, this.marginBottom + 15);
    ctx.lineWidth = 1;
    if (this.noteHPositions[i].color === 'white') {
      ctx.strokeStyle = 'rgb(255, 255, 255)';
      ctx.fillStyle = 'rgb(255, 255, 255)';
    } else if (this.noteHPositions[i].color === 'black') {
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.fillStyle = 'rgb(0, 0, 0)';
    }
    ctx.stroke();

    if (this.noteHPositions[i].name) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.noteHPositions[i].name, this.noteHPositions[i].x, this.marginBottom + 25);
    }
  }

  for (let i = 0; i < this.noteVPositions.length; i++) {
    ctx.beginPath();
    if (this.noteVPositions[i].name) {
      ctx.moveTo(this.marginRight, this.noteVPositions[i].y);
    } else {
      ctx.moveTo(this.marginLeft, this.noteVPositions[i].y);
    }
    ctx.lineTo(this.marginLeft - 15, this.noteVPositions[i].y);

    if (this.noteVPositions[i].color === 'white') {
      ctx.strokeStyle = 'rgb(255, 255, 255)';
      ctx.fillStyle = 'rgb(255, 255, 255)';
    } else if (this.noteVPositions[i].color === 'black') {
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.fillStyle = 'rgb(0, 0, 0)';
    }
    ctx.stroke();

    if (this.noteVPositions[i].name) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.noteVPositions[i].name, this.marginLeft - 23, this.noteVPositions[i].y + 3);
    }
  }
};