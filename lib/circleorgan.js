// canvas should have square dimensions: 800x800
function CircleOrgan(canvas) {
  let self = this;
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.note = null;

  this.outerR = this.canvas.height/2;
  this.R = this.outerR - 50;
  this.r = 1;
  this.center = {
    x: this.canvas.width/2,
    y: this.canvas.height/2
  };
  this.innerOctave = 0;
  this.outerOctave = 10;

  this.bwGradient = null;
  this.setupGradients();

  this.status = 'unloaded';

  this.colorWheel = new Image();
  this.colorWheel.onload = function () {
    if (self.status === 'unloaded') {
      self.status = 'ready';
    } else if (self.status === 'waiting') {
      self.status = 'ready';
      self.draw();
    }
  }
  this.colorWheel.src = '../png/general/colorwheel.png';
  this.colorWheelCenter = { // center of image
    x: 800,
    y: 800
  };

  this.notePositions = [];
  this.setupNotePositions();
}

CircleOrgan.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

CircleOrgan.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  if (this.note) {
    this.note.stop();
  }
  this.draw();
};

CircleOrgan.prototype.draw = function () {
  if (this.status === 'unloaded') {
    this.status = 'waiting';
    return;
  } else if (this.status !== 'ready') {
    return;
  }

  let ctx = this.ctx;

  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.outerR, 0, 2*Math.PI, false);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.R, 0, 2*Math.PI, false);
  ctx.clip();
  ctx.drawImage(this.colorWheel, this.colorWheelCenter.x - this.canvas.width/2, this.colorWheelCenter.y - this.canvas.height/2,
    this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.R, 0, 2*Math.PI, false);
  ctx.fillStyle = this.bwGradient;
  ctx.fill();

  for (let i = 0; i < this.notePositions.length; i++) {
    let note = this.notePositions[i];

    ctx.save();
    ctx.translate(this.center.x, this.center.y);
    ctx.rotate(Math.PI/2 - note.t);

    ctx.strokeStyle = note.color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, -this.R);
    ctx.lineTo(0, -this.R - 10);
    ctx.stroke();

    ctx.fillStyle = note.color;
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.fillText(note.name, 0, -this.R - 15);

    ctx.restore();
  }
};

CircleOrgan.prototype.setupGradients = function () {
  let ctx = this.ctx;
  this.bwGradient = ctx.createRadialGradient(this.center.x, this.center.y, this.r, this.center.x, this.center.y, this.R);
  this.bwGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  this.bwGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  this.bwGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  this.bwGradient.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
};

// r measured from the center; t measured widdershins from +x axis (so -y axis is π/2)
CircleOrgan.prototype.rectangularToPolar = function (x, y) {
  return {
    r: Math.sqrt((x - this.center.x)*(x - this.center.x) + (y - this.center.y)*(y - this.center.y)),
    t: Math.atan2((this.center.y - y), (x - this.center.x)) // 
  };
};

CircleOrgan.prototype.polarToRectangular = function (r, t) {
  return {
    x: this.center.x + r*Math.cos(t),
    y: this.center.y - r*Math.sin(t)
  }
};

CircleOrgan.prototype.setupEvents = function () {
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

CircleOrgan.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
  this.generateNote(x, y);
  if (this.note !== null) {
    this.note.play();
  }
};

CircleOrgan.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
};

CircleOrgan.prototype.onMouseMove = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.note !== null) {
    this.adjustNote(x, y);
  }
};

CircleOrgan.prototype.generateNote = function (x, y) {
  let p = this.rectangularToPolar(x, y);
  let freq = this.tToFreq(p.t);
  let param = this.rToParam(p.r);
  let gain = 0.1;
  if (freq === null || param === null) {
    gain = 0;
  }

  this.note = new Tone(freq, -1, gain);
  this.note.shepardOctaveParameter = param;
  this.note.setFormula('shepardOctave');
  this.note.envelope.attack = 10;
  this.note.envelope.decay = 0;
  this.note.envelope.attackGain = 1.0;
  this.note.audioPlayer = this.audioPlayer;
};

CircleOrgan.prototype.adjustNote = function (x, y) {
  let p = this.rectangularToPolar(x, y);
  let freq = this.tToFreq(p.t);
  let param = this.rToParam(p.r);
  let gain = 0.1;
  if (freq === null || param === null) {
    gain = 0;
  }
  this.note.adjustShepardFrequency(freq);
  this.note.gain = gain;
  this.note.generateShepardOctaveOffsets(param);
};

CircleOrgan.prototype.tToFreq = function (t) {
  let angle = (Math.PI/2.0) - t;
  while (angle < 0) {
    angle += 2.0*Math.PI;
  }
  let o = angle/(2.0*Math.PI); // fraction of circle
  return C0*Math.pow(2, o);
};

CircleOrgan.prototype.rToParam = function (r) {
  if (r < this.r || r > this.R || r <= 0) { // can't get an angle with r = 0
    return null;
  }
  let fraction = (r - this.r)/(this.R - this.r);
  return this.innerOctave + (this.outerOctave - this.innerOctave)*fraction;
};

CircleOrgan.prototype.setupNotePositions = function () {
  this.notePositions.push({
    name: 'C',
    t: Math.PI/2,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'C#/Db',
    t: Math.PI/3,
    color: 'rgb(0, 0, 0)'
  });
  this.notePositions.push({
    name: 'D',
    t: Math.PI/6,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'D#/Eb',
    t: 0,
    color: 'rgb(0, 0, 0)'
  });
  this.notePositions.push({
    name: 'E',
    t: -Math.PI/6,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'F',
    t: -Math.PI/3,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'F#/Gb',
    t: -Math.PI/2,
    color: 'rgb(0, 0, 0)'
  });
  this.notePositions.push({
    name: 'G',
    t: -2*Math.PI/3,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'G#/Ab',
    t: -5*Math.PI/6,
    color: 'rgb(0, 0, 0)'
  });
  this.notePositions.push({
    name: 'A',
    t: Math.PI,
    color: 'rgb(255, 255, 255)'
  });
  this.notePositions.push({
    name: 'A#/Bb',
    t: 5*Math.PI/6,
    color: 'rgb(0, 0, 0)'
  });
  this.notePositions.push({
    name: 'B',
    t: 2*Math.PI/3,
    color: 'rgb(255, 255, 255)'
  });
};