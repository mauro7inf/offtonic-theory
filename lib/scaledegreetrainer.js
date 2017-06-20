function ScaleDegreeTrainer(canvas) {
  let self = this;

  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();

  this.roots = [];
  this.notes = [];
  this.intervals = {};
  this.setupNotes();
  this.setupIntervals();

  this.windowInterval = null;

  this.frame = 0;
  this.playing = null; // becomes false when stop is called

  this.interval = null;
  this.rootTone = null;
  this.noteTone = null;

  this.drawStopBanner();
}

ScaleDegreeTrainer.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.frame = 0;
  this.start();
  this.play(); // start sets an interval so there's a delay; start immediately
};

ScaleDegreeTrainer.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  this.stop();
};

ScaleDegreeTrainer.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
};

ScaleDegreeTrainer.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this === activeKeyboard) {
    this.off();
  } else {
    this.on();
  }
};

ScaleDegreeTrainer.prototype.start = function () {
  let self = this;
  this.frame = 0;
  this.playing = true;
  this.windowInterval = window.setInterval(self.play.bind(self), 1000);
  this.clear();
  this.drawBorder();
}

ScaleDegreeTrainer.prototype.stop = function () {
  this.playing = false;
  window.clearInterval(this.windowInterval);
  this.clear();
  this.drawStopBanner();
}

ScaleDegreeTrainer.prototype.play = function () {
  if (!this.playing) {
    return;
  }
  if (this.frame === 0) {
    this.interval = this.pickInterval();
    this.setupTones();
    this.clear();
    this.drawBorder();
    this.rootTone.play();
  } else if (this.frame === 2) {
    this.noteTone.play();
    this.drawScaleDegreePrompt();
  } else if (this.frame === 6) {
    this.drawScaleDegreeName();
  } else if (this.frame === 8) {
    this.rootTone.stop();
    this.noteTone.stop();
  }
  this.frame++;
  if (this.frame === 10) {
    this.frame = 0;
  }
};

ScaleDegreeTrainer.prototype.reducedMod = function (i, m) {
  return i >= 0 ? i % m : m + (i % m);
};

ScaleDegreeTrainer.prototype.setupNotes = function () {
  const s = Math.pow(2, 1.0/12.0);
  const C3 = 8*C0;
  const C4 = 16*C0;
  const C5 = 32*C0;

  for (let i = -5; i < 7; i++) {
    this.roots.push({
      freq: C3*Math.pow(s, i),
      number: this.reducedMod(i, 12)
    });
    this.notes.push({
      freq: C4*Math.pow(s, i),
      number: this.reducedMod(i, 12)
    });
    this.notes.push({
      freq: C5*Math.pow(s, i),
      number: this.reducedMod(i, 12)
    });
  }
};

ScaleDegreeTrainer.prototype.setupIntervals = function () {
  this.intervals[0] = '1';
  this.intervals[1] = '#1/b2';
  this.intervals[2] = '2';
  this.intervals[3] = '#2/b3';
  this.intervals[4] = '3';
  this.intervals[5] = '4';
  this.intervals[6] = '#4/b5';
  this.intervals[7] = '5';
  this.intervals[8] = '#5/b6';
  this.intervals[9] = '6';
  this.intervals[10] = '#6/b7';
  this.intervals[11] = '7';
};

ScaleDegreeTrainer.prototype.calculateInterval = function (rootNumber, noteNumber) {
  return this.intervals[this.reducedMod(noteNumber - rootNumber, 12)];
};

ScaleDegreeTrainer.prototype.pickInterval = function () {
  let rootIndex = Math.floor(this.roots.length*Math.random());
  let root = this.roots[rootIndex];
  let noteIndex = Math.floor(this.notes.length*Math.random());
  let note = this.notes[noteIndex];
  let interval = this.calculateInterval(root.number, note.number);

  return {
    root: root,
    note: note,
    interval: interval
  };
};

ScaleDegreeTrainer.prototype.setupTones = function () {
  let root = this.interval.root;
  let note = this.interval.note;

  this.rootTone = new Tone(root.freq, -1, 0.1);
  this.rootTone.setFormula('oddSawtooth5');
  this.rootTone.addFilter(new CutoffFilter(-1, 0.7));
  this.rootTone.envelope.release = 200;

  this.noteTone = new Tone(note.freq, -1, 0.04);
  this.noteTone.setFormula('sawtooth5');
  this.noteTone.addFilter(new DelayFilter(0.5, 0.75));
  this.noteTone.envelope.release = 200;
};

ScaleDegreeTrainer.prototype.clear = function () {
  let ctx = this.ctx;
  ctx.clearRect(0, 0, 220, 200);
};

ScaleDegreeTrainer.prototype.drawBorder = function () {
  let ctx = this.ctx;

  let x = 8;
  let y = 1.5;
  let w = 204;
  let h = 197;

  ctx.strokeStyle = 'rgb(128, 128, 255)';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgb(64, 64, 255)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
};

ScaleDegreeTrainer.prototype.drawStopBanner = function () {
  let ctx = this.ctx;

  let x = 8;
  let y = 1.5;
  let w = 204;
  let h = 197;

  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(x, y, w, h);
  
  this.drawBorder();

  ctx.textAlign = 'center';
  ctx.font = '64px serif';
  ctx.fillStyle = 'rgb(238, 238, 238)';
  ctx.fillText('Click', 110, 70);
  ctx.fillText('to', 110, 120);
  ctx.fillText('start', 110, 170);
};

ScaleDegreeTrainer.prototype.drawScaleDegreePrompt = function () {
  let ctx = this.ctx;

  this.clear();
  this.drawBorder();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.font = '32px serif';
  ctx.fillText('Scale degree:', 110, 70);
};

ScaleDegreeTrainer.prototype.drawScaleDegreeName = function () {
  let ctx = this.ctx;

  this.clear();
  this.drawBorder();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.font = '32px serif';
  ctx.fillText('Scale degree:', 110, 70);
  ctx.font = '84px serif';
  ctx.fillText(this.interval.interval, 110, 160);
};