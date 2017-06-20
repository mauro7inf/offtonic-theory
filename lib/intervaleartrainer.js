function IntervalEarTrainer(canvas) {
  let self = this;

  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();

  this.roots = [];
  this.notes = [];
  this.intervalNames = [];
  this.intervalClasses = [];
  this.directions = ['asc', 'desc', 'chord'];
  this.setupNotes();
  this.setupIntervalNames();
  this.setupIntervals();

  this.windowInterval = null;

  this.frame = 0;
  this.playing = null; // becomes false when stop is called

  this.interval = null;
  this.rootTone = null;
  this.lowerNoteTone = null;
  this.upperNoteTone = null;

  this.drawStopBanner();
}

IntervalEarTrainer.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.frame = 0;
  this.start();
  this.play(); // start sets an interval so there's a delay; start immediately
};

IntervalEarTrainer.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  this.stop();
};

IntervalEarTrainer.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
};

IntervalEarTrainer.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this === activeKeyboard) {
    this.off();
  } else {
    this.on();
  }
};

IntervalEarTrainer.prototype.start = function () {
  let self = this;
  this.frame = 0;
  this.playing = true;
  this.windowInterval = window.setInterval(self.play.bind(self), 1000);
  this.clear();
  this.drawBorder();
}

IntervalEarTrainer.prototype.stop = function () {
  this.playing = false;
  window.clearInterval(this.windowInterval);
  this.clear();
  this.drawStopBanner();
}

IntervalEarTrainer.prototype.play = function () {
  if (!this.playing) {
    return;
  }
  if (this.frame === 0) {
    this.interval = this.pickInterval();
    this.setupTones();
    this.clear();
    this.drawBorder();
    this.rootTone.play();
    this.frame++;
  } else {
    if (this.interval.direction === 'asc') {
      return this.playAsc();
    } else if (this.interval.direction === 'desc') {
      return this.playDesc();
    } else if (this.interval.direction === 'chord') {
      return this.playChord();
    }
  }
};

IntervalEarTrainer.prototype.playAsc = function () {
  if (this.frame === 2) {
    this.lowerNoteTone.play();
    this.drawIntervalNamePrompt();
  } else if (this.frame === 4) {
    this.lowerNoteTone.stop();
    this.upperNoteTone.play();
  } else if (this.frame === 8) {
    this.setupLowerNoteTone();
    this.lowerNoteTone.play();
    this.drawIntervalName();
  } else if (this.frame === 10) {
    this.rootTone.stop();
    this.lowerNoteTone.stop();
    this.upperNoteTone.stop();
  }
  this.frame++;
  if (this.frame === 12) {
    this.frame = 0;
  }
};

IntervalEarTrainer.prototype.playDesc = function () {
  if (this.frame === 2) {
    this.upperNoteTone.play();
    this.drawIntervalNamePrompt();
  } else if (this.frame === 4) {
    this.upperNoteTone.stop();
    this.lowerNoteTone.play();
  } else if (this.frame === 8) {
    this.setupUpperNoteTone();
    this.upperNoteTone.play();
    this.drawIntervalName();
  } else if (this.frame === 10) {
    this.rootTone.stop();
    this.lowerNoteTone.stop();
    this.upperNoteTone.stop();
  }
  this.frame++;
  if (this.frame === 12) {
    this.frame = 0;
  }
};

IntervalEarTrainer.prototype.playChord = function () {
  if (this.frame === 2) {
    this.lowerNoteTone.play();
    this.upperNoteTone.play();
    this.drawIntervalNamePrompt();
  } else if (this.frame === 6) {
    this.drawIntervalName();
  } else if (this.frame === 8) {
    this.rootTone.stop();
    this.lowerNoteTone.stop();
    this.upperNoteTone.stop();
  }
  this.frame++;
  if (this.frame === 10) {
    this.frame = 0;
  }
};

IntervalEarTrainer.prototype.setupNotes = function () {
  const s = Math.pow(2, 1.0/12.0);
  const C3 = 8*C0;
  const C4 = 16*C0;

  for (let i = -5; i < 19; i++) {
    if (i < 7) {
      this.roots.push({
        freq: C3*Math.pow(s, i)
      });
    }
    this.notes.push({
      freq: C4*Math.pow(s, i),
      number: i
    });
  }
};

IntervalEarTrainer.prototype.setupIntervalNames = function () {
  this.intervalNames[0] = 'P1';
  this.intervalNames[1] = 'A1/m2';
  this.intervalNames[2] = 'M2/d3';
  this.intervalNames[3] = 'A2/m3';
  this.intervalNames[4] = 'M3/d4';
  this.intervalNames[5] = 'P4';
  this.intervalNames[6] = 'A4/d5';
  this.intervalNames[7] = 'P5';
  this.intervalNames[8] = 'A5/m6';
  this.intervalNames[9] = 'M6/d7';
  this.intervalNames[10] = 'A6/m7';
  this.intervalNames[11] = 'M7/d8';
  this.intervalNames[12] = 'P8';
  this.intervalNames[13] = 'A8/m9';
  this.intervalNames[14] = 'M9/d10';
};

IntervalEarTrainer.prototype.setupIntervals = function () {
  for (let i = 0; i <= 14; i++) {
    let intervals = [];
    for (let j = 0; j + i < this.notes.length; j++) {
      intervals.push([this.notes[j], this.notes[j + i]]);
    }
    this.intervalClasses.push({
      intervals: intervals,
      name: this.intervalNames[i]
    });
  }
};

IntervalEarTrainer.prototype.pickInterval = function () {
  let rootIndex = Math.floor(this.roots.length*Math.random());
  let root = this.roots[rootIndex];
  let intervalClassIndex = Math.floor(this.intervalClasses.length*Math.random());
  let intervalClass = this.intervalClasses[intervalClassIndex];
  let intervalIndex = Math.floor(intervalClass.intervals.length*Math.random());
  let interval = intervalClass.intervals[intervalIndex];
  let intervalName = intervalClass.name;
  let directionIndex = Math.floor(this.directions.length*Math.random());
  let direction = this.directions[directionIndex];

  return {
    root: root,
    lowerNote: interval[0],
    upperNote: interval[1],
    name: intervalName,
    direction: direction
  };
};

IntervalEarTrainer.prototype.setupTones = function () {
  this.setupRootTone();
  this.setupLowerNoteTone();
  this.setupUpperNoteTone();
};

IntervalEarTrainer.prototype.setupRootTone = function () {
  let root = this.interval.root;
  this.rootTone = new Tone(root.freq, -1, 0.1);
  this.rootTone.setFormula('oddSawtooth5');
  this.rootTone.addFilter(new CutoffFilter(-1, 0.7));
  this.rootTone.envelope.release = 200;
};

IntervalEarTrainer.prototype.setupLowerNoteTone = function () {
  let lowerNote = this.interval.lowerNote;
  this.lowerNoteTone = new Tone(lowerNote.freq, -1, 0.04);
  this.lowerNoteTone.setFormula('sawtooth5');
  this.lowerNoteTone.addFilter(new DelayFilter(0.5, 0.75));
  this.lowerNoteTone.envelope.release = 200;
};

IntervalEarTrainer.prototype.setupUpperNoteTone = function () {
  let upperNote = this.interval.upperNote;
  this.upperNoteTone = new Tone(upperNote.freq, -1, 0.04);
  this.upperNoteTone.setFormula('sawtooth5');
  this.upperNoteTone.addFilter(new DelayFilter(0.5, 0.75));
  this.upperNoteTone.envelope.release = 200;
};

IntervalEarTrainer.prototype.clear = function () {
  let ctx = this.ctx;
  ctx.clearRect(0, 0, 220, 200);
};

IntervalEarTrainer.prototype.drawBorder = function () {
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

IntervalEarTrainer.prototype.drawStopBanner = function () {
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

IntervalEarTrainer.prototype.drawIntervalNamePrompt = function () {
  let ctx = this.ctx;

  this.clear();
  this.drawBorder();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.font = '32px serif';
  ctx.fillText('Interval:', 110, 70);
};

IntervalEarTrainer.prototype.drawIntervalName = function () {
  let ctx = this.ctx;

  this.clear();
  this.drawBorder();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.font = '32px serif';
  ctx.fillText('Interval:', 110, 70);
  ctx.font = '64px serif';
  ctx.fillText(this.interval.name, 110, 155);
};