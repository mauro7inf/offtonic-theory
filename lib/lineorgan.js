// canvas should have the correct dimensions: 800x400
function LineOrgan(canvas, type) {
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.note = null;

  this.type = type; // linear or logarithmic

  this.marginTop = 40;
  this.marginBottom = this.canvas.height - 30;
  this.marginLeft = 15;
  this.marginRight = this.canvas.width - 15;

  this.freqLeft = C0;
  this.freqRight = 1024*C0; // C10
  this.octaveRight = Math.log(this.freqRight/this.freqLeft)/Math.log(2);
  this.notePositions = [];
  this.hashPositions = [];
  this.setupNotePositions();
  this.setupHashPositions();

  this.colorGradient = null;
  this.grayGradient = null;
  this.setupGradients();
}

LineOrgan.prototype.freqToX = function (freq) {
  if (freq < this.freqLeft || freq > this.freqRight) {
    return null;
  }
  if (this.type === 'linear') {
    return this.marginLeft + ((freq - this.freqLeft)/(this.freqRight - this.freqLeft))*(this.marginRight - this.marginLeft);
  } else if (this.type === 'logarithmic') {
    let octave = Math.log(freq/this.freqLeft)/Math.log(2);
    return this.marginLeft + (octave/this.octaveRight)*(this.marginRight - this.marginLeft);
  }
};

LineOrgan.prototype.xToFreq = function (x) {
  if (x < this.marginLeft || x > this.marginRight) {
    return null;
  }
  if (this.type === 'linear') {
    return this.freqLeft + ((x - this.marginLeft)/(this.marginRight - this.marginLeft))*(this.freqRight - this.freqLeft);
  } else if (this.type === 'logarithmic') {
    let octave = ((x - this.marginLeft)/(this.marginRight - this.marginLeft))*this.octaveRight;
    return Math.pow(2, octave)*this.freqLeft;
  }
};

LineOrgan.prototype.setupNotePositions = function () {
  let s = Math.pow(2, 1.0/12.0);
  let f = this.freqLeft;
  this.notePositions.push({
    name: 'C0',
    color: 'white',
    freq: f,
    x: this.marginLeft
  });
  for (let o = 0; o < 10; o++) {
    let nf = f*s;
    this.notePositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'black',
      freq: nf,
      x: this.freqToX(nf)
    });
    nf *= s;
    this.notePositions.push({
      color: 'white',
      freq: nf,
      x: this.freqToX(nf)
    });
    f *= 2;
    this.notePositions.push({
      name: 'C' + (o + 1),
      color: 'white',
      freq: f,
      x: this.freqToX(f)
    });
  }
};

LineOrgan.prototype.setupHashPositions = function () {
  // every 1000
  for (let f = 1000; f < this.freqRight; f += 1000) {
    this.hashPositions.push({
      name: f + ' Hz',
      freq: f,
      x: this.freqToX(f)
    });
  }
};

LineOrgan.prototype.setupGradients = function () {
  this.colorGradient = this.ctx.createLinearGradient(this.marginLeft, (this.marginTop + this.marginBottom)/2,
    this.marginRight, (this.marginTop + this.marginBottom)/2);
  for (let i = 0; i < this.notePositions.length; i++) {
    let stop = (this.notePositions[i].x - this.marginLeft)/(this.marginRight - this.marginLeft);
    this.colorGradient.addColorStop(stop, this.freqToColor(this.notePositions[i].freq));
  }

  this.grayGradient = this.ctx.createLinearGradient((this.marginLeft + this.marginRight)/2, this.marginBottom,
    (this.marginLeft + this.marginRight)/2, this.marginTop);
  this.grayGradient.addColorStop(0, 'rgba(128, 128, 128, 1)');
  this.grayGradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
};

LineOrgan.prototype.freqToColor = function (freq) {
  let octavesAboveC0 = Math.log(freq/C0)/(Math.log(2)); // octave-based
  let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
  return 'hsl(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%)';
};

LineOrgan.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

LineOrgan.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  if (this.note) {
    this.note.stop();
  }
  this.draw();
};

LineOrgan.prototype.setupEvents = function () {
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

LineOrgan.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  this.generateNote(x, y);
  if (this.note !== null) {
    this.note.play();
  }
};

LineOrgan.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
};

LineOrgan.prototype.onMouseMove = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.note !== null) {
    this.adjustNote(x, y);
  }
};

LineOrgan.prototype.generateNote = function (x, y) {
  let freq = this.xToFreq(x);
  let gain = 0.1*(this.marginBottom - y)/(this.marginBottom - this.marginTop);
  if (y < this.marginTop || y > this.marginBottom) {
    gain = 0;
  }
  this.note = new Tone(freq, -1, gain);
  this.note.setFormula('sawtooth');
  this.note.envelope.attack = 10;
  this.note.envelope.decay = 0;
  this.note.envelope.attackGain = 1.0;
  this.note.audioPlayer = this.audioPlayer;
  this.note.addFilter(new DelayFilter(0.6, 0.8));
};

LineOrgan.prototype.adjustNote = function (x, y) {
  let freq = this.xToFreq(x);
  let gain = 0.1*(this.marginBottom - y)/(this.marginBottom - this.marginTop);
  if (y < this.marginTop || y > this.marginBottom) {
    gain = 0;
  }
  this.note.frequency = freq;
  this.note.gain = gain;
};

LineOrgan.prototype.draw = function () {
  let ctx = this.ctx;

  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  ctx.fillStyle = this.colorGradient;
  ctx.fillRect(this.marginLeft, this.marginTop, this.marginRight - this.marginLeft, this.marginBottom - this.marginTop);
  ctx.fillStyle = this.grayGradient;
  ctx.fillRect(this.marginLeft, this.marginTop, this.marginRight - this.marginLeft, this.marginBottom - this.marginTop);

  for (let i = 0; i < this.notePositions.length; i++) {
    ctx.beginPath();
    if (this.notePositions[i].name) {
      ctx.moveTo(this.notePositions[i].x, this.marginBottom);
    } else {
      ctx.moveTo(this.notePositions[i].x, this.marginTop);
    }
    ctx.lineTo(this.notePositions[i].x, this.marginTop - 20);
    ctx.lineWidth = 1;
    if (this.notePositions[i].color === 'white') {
      ctx.strokeStyle = 'rgb(255, 255, 255)';
      ctx.fillStyle = 'rgb(255, 255, 255)';
    } else if (this.notePositions[i].color === 'black') {
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.fillStyle = 'rgb(0, 0, 0)';
    }
    ctx.stroke();

    if (this.notePositions[i].name) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.notePositions[i].name, this.notePositions[i].x, this.marginTop - 25);
    }
  }

  for (let j = 0; j < this.hashPositions.length; j++) {
    ctx.beginPath();
    ctx.moveTo(this.hashPositions[j].x, this.marginBottom);
    ctx.lineTo(this.hashPositions[j].x, this.marginBottom + 10);
    ctx.lineWidth = 1;
    if (this === activeKeyboard) {
      ctx.strokeStyle = 'rgb(192, 192, 192)';
      ctx.fillStyle = 'rgb(192, 192, 192)';
    } else {
      ctx.strokeStyle = 'rgb(128, 128, 128)';
      ctx.fillStyle = 'rgb(128, 128, 128)';
    }
    ctx.stroke();

    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.hashPositions[j].name, this.hashPositions[j].x, this.marginBottom + 20);
  }
};