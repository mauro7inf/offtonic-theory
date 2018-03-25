// Dependencies: globals.js, audioplayer.js, tone.js

// canvas should have the correct dimensions: 800x200
function IntervalExplorer(canvas, droneFreq, freqLeft, freqRight) {
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.drone = null;
  this.note = null;

  this.marginTop = 40;
  this.marginBottom = this.canvas.height - 38;
  this.marginLeft = 20;
  this.marginRight = this.canvas.width - 20;

  this.droneFreq = droneFreq;
  this.freqLeft = freqLeft;
  this.freqRight = freqRight;
  this.octaveRight = Math.log(this.freqRight/this.freqLeft)/Math.log(2);
  this.notePositions = [];
  this.setupNotePositions();

  this.colorGradient = null;
  this.setupGradient();
}

IntervalExplorer.prototype.freqToX = function (freq) {
  if (freq < this.freqLeft || freq > this.freqRight) {
    return null;
  }
  let octave = Math.log(freq/this.freqLeft)/Math.log(2);
  return this.marginLeft + (octave/this.octaveRight)*(this.marginRight - this.marginLeft);
};

IntervalExplorer.prototype.xToFreq = function (x) {
  if (x < this.marginLeft || x > this.marginRight) {
    return null;
  }
  let octave = ((x - this.marginLeft)/(this.marginRight - this.marginLeft))*this.octaveRight;
  return Math.pow(2, octave)*this.freqLeft;
};

// constant lightness
IntervalExplorer.prototype.freqToColor = function (freq) {
  let octavesAboveC0 = Math.log(freq/C0)/(Math.log(2)); // octave-based
  let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
  return 'hsla(' + Math.floor(360*pitchClass) + ', 100%, 50%, 1)';
};

IntervalExplorer.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

IntervalExplorer.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  if (this.note) {
    this.note.stop();
  }
  this.draw();
};

IntervalExplorer.prototype.setupEvents = function () {
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

IntervalExplorer.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.drone !== null) {
    this.drone.stop();
    this.drone = null;
  }
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
  this.generateNotes(x, y);
  if (this.drone !== null) {
    this.drone.play();
  }
  if (this.note !== null) {
    this.note.play();
  }
};

IntervalExplorer.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.drone !== null) {
    this.drone.stop();
    this.drone = null;
  }
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
};

IntervalExplorer.prototype.onMouseMove = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (this.drone !== null && this.note !== null) {
    this.adjustNotes(x, y);
  }
};

IntervalExplorer.prototype.generateNotes = function (x, y) {
  let freq = this.xToFreq(x);
  let gain = 0.1;
  if (freq === null || y < this.marginTop || y > this.marginBottom) {
    gain = 0;
  }

  gain /= 1.75;
  this.drone = new Tone(this.droneFreq, -1, gain);
  this.drone.setFormula('oddSawtooth5');
  this.drone.envelope.attack = 10;
  this.drone.envelope.decay = 0;
  this.drone.envelope.attackGain = 1.0;
  this.drone.audioPlayer = this.audioPlayer;
  this.drone.addFilter(new CutoffFilter(-1, 0.7));
  this.drone.addFilter(new DelayFilter(0.5, 0.75));

  this.note = new Tone(freq, -1, gain);
  this.note.setFormula('oddSawtooth5');
  this.note.envelope.attack = 10;
  this.note.envelope.decay = 0;
  this.note.envelope.attackGain = 1.0;
  this.note.audioPlayer = this.audioPlayer;
  this.note.addFilter(new CutoffFilter(-1, 0.8));
  this.note.addFilter(new DelayFilter(0.5, 0.75));
};

IntervalExplorer.prototype.adjustNotes = function (x, y) {
  let freq = this.xToFreq(x);
  let gain = 0.1;
  if (freq === null || y < this.marginTop || y > this.marginBottom) {
    gain = 0;
  }
  gain /= 1.75;
  this.drone.gain = gain;
  this.note.frequency = freq;
  this.note.gain = gain;
};

IntervalExplorer.prototype.draw = function () {
  let self = this;
  let ctx = this.ctx;

  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  ctx.fillStyle = this.colorGradient;
  ctx.fillRect(this.marginLeft, this.marginTop, this.marginRight - this.marginLeft, this.marginBottom - this.marginTop);

  let notePositions = this.notePositions.filter(function (notePosition) {
    return notePosition.x >= self.marginLeft && notePosition.x <= self.marginRight;
  });
  for (let i = 0; i < notePositions.length; i++) {
    ctx.beginPath();
    let yOffset = 0;
    if ('yOffset' in notePositions[i]) {
      yOffset = notePositions[i].yOffset;
    }
    if (notePositions[i].name) {
      ctx.moveTo(notePositions[i].x, this.marginBottom);
      ctx.lineTo(notePositions[i].x, this.marginTop - 10 + yOffset);
    } else if (notePositions[i].lowerName) {
      ctx.moveTo(notePositions[i].x, this.marginBottom);
      ctx.lineTo(notePositions[i].x, this.marginBottom + 10);
    } else {
      ctx.moveTo(notePositions[i].x, this.marginTop);
      ctx.lineTo(notePositions[i].x, this.marginTop - 10 + yOffset);
    }
    ctx.lineWidth = 1;
    let color = notePositions[i].color;
    if (color === 'white') {
      color = 'rgb(255, 255, 255)';
    } else if (color === 'black') {
      color = 'rgb(0, 0, 0)';
    } else if (color === 'gray') {
      if (this === activeKeyboard) {
        color = 'rgb(192, 192, 192)';
      } else {
        color = 'rgb(128, 128, 128)';
      }
    }
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.stroke();

    if (notePositions[i].name) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(notePositions[i].name, notePositions[i].x, this.marginTop - 15 + yOffset);
    } else if (notePositions[i].lowerName) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(notePositions[i].lowerName, notePositions[i].x, this.marginBottom + 25);
    }
  }
};

IntervalExplorer.prototype.setupGradient = function () {
  let self = this;
  this.colorGradient = this.ctx.createLinearGradient(this.marginLeft, (this.marginTop + this.marginBottom)/2,
    this.marginRight, (this.marginTop + this.marginBottom)/2);
  let notePositions = this.notePositions.filter(function (notePosition) {
    return notePosition.x >= self.marginLeft && notePosition.x <= self.marginRight;
  });
  for (let i = 0; i < notePositions.length; i++) {
    let stop = (notePositions[i].x - this.marginLeft)/(this.marginRight - this.marginLeft);
    this.colorGradient.addColorStop(stop, this.freqToColor(notePositions[i].freq, 1.0));
  }
};

IntervalExplorer.prototype.addNotePosition = function (notePosition) {
  let freq;
  if ('freq' in notePosition) {
    freq = notePosition.freq;
  } else if ('ratio' in notePosition) {
    freq = this.droneFreq * notePosition.ratio;
  } else if ('cents' in notePosition) {
    freq = this.droneFreq * Math.pow(2, notePosition.cents/1200.0);
  }
  let newPosition = {
    freq: freq,
    x: this.freqToX(freq),
    color: notePosition.color
  };
  if ('name' in notePosition) {
    newPosition.name = notePosition.name;
  }
  if ('yOffset' in notePosition) {
    newPosition.yOffset = notePosition.yOffset;
  }
  if ('lowerName' in notePosition) {
    newPosition.lowerName = notePosition.lowerName;
  }
  this.notePositions.push(newPosition);
};

IntervalExplorer.prototype.setupNotePositions = function () {
  this.addNotePosition({
    name: '-50¢',
    cents: -50,
    color: 'gray'
  });
  this.addNotePosition({
    cents: -40,
    color: 'gray'
  });
  this.addNotePosition({
    cents: -30,
    color: 'gray'
  });
  this.addNotePosition({
    cents: -20,
    color: 'gray'
  });
  this.addNotePosition({
    cents: -10,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'P1, 0¢ (1/1)',
    cents: 0,
    color: 'white'
  });
  this.addNotePosition({
    cents: 10,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 20,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean Comma (531441/524288)',
    ratio: Math.pow(3, 12)/Math.pow(2, 19),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Syntonic Comma (81/80)',
    ratio: 81/80,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 30,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 40,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Diesis (128/125)',
    ratio: 128/125,
    color: 'gray'
  });
  this.addNotePosition({
    name: '50¢',
    cents: 50,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 60,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET A1',
    ratio: Math.pow(2, 1/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 70,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET m2',
    ratio: Math.pow(2, 1/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Minor A1 (25/24)',
    ratio: 25/24,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 80,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 90,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean m2 (256/243)        ',
    ratio: 256/243,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Major A1 (135/128)',
    ratio: 135/128,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'A1/m2, 100¢',
    cents: 100,
    color: 'black'
  });
  this.addNotePosition({
    cents: 110,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure m2 (16/15)',
    ratio: 16/15,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean A1 (2187/2048)',
    ratio: 2187/2048,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 120,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET m2',
    ratio: Math.pow(2, 2/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 130,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Semitone Maximus (27/25)',
    ratio: 27/25,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 140,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A1',
    ratio: Math.pow(2, 2/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: '150¢',
    cents: 150,
    color: 'gray'
  });
  this.addNotePosition({
    name: '             Undecimal (12/11)',
    ratio: 12/11,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 160,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (11/10)',
    ratio: 11/10,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 170,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 180,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Minor Whole Tone (10/9)',
    ratio: 10/9,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '19-TET M2',
    ratio: Math.pow(2, 3/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 190,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'M2, 200¢',
    cents: 200,
    color: 'white'
  });
  this.addNotePosition({
    name: 'Major Whole Tone (9/8)',
    ratio: 9/8,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 210,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET M2',
    ratio: Math.pow(2, 3/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 220,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 230,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (8/7)',
    ratio: 8/7,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 240,
    color: 'gray'
  });
  this.addNotePosition({
    name: '250¢',
    cents: 250,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET A2',
    ratio: Math.pow(2, 4/19),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 260,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (7/6)',
    ratio: 7/6,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 270,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 280,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET m3',
    ratio: Math.pow(2, 4/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 290,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean Minor Third (32/27)',
    ratio: 32/27,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'A2/m3, 300¢',
    cents: 300,
    color: 'black'
  });
  this.addNotePosition({
    cents: 310,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Minor Third (6/5)',
    ratio: 6/5,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '19-TET m3',
    ratio: Math.pow(2, 5/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 320,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 330,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 340,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (11/9)',
    ratio: 11/9,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '350¢',
    cents: 350,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A2',
    ratio: Math.pow(2, 5/17),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 360,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 370,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET M3',
    ratio: Math.pow(2, 6/19),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 380,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Major Third (5/4)',
    ratio: 5/4,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 390,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'M3/d4, 400¢',
    cents: 400,
    color: 'white'
  });
  this.addNotePosition({
    name: 'Pythagorean Major Third (81/64)',
    ratio: 81/64,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'Wolf Diminished Fourth (32/25)',
    ratio: 32/25,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 410,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (14/11)                ', // gotta move stuff over
    ratio: 14/11,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 420,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET M3',
    ratio: Math.pow(2, 6/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 430,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (9/7)',
    ratio: 9/7,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 440,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET d4',
    ratio: Math.pow(2, 7/19),
    color: 'gray'
  });
  this.addNotePosition({
    name: '450¢',
    cents: 450,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 460,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 470,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 480,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 490,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET P4',
    ratio: Math.pow(2, 7/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Fourth (4/3)',
    ratio: 4/3,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'P4, 500¢',
    cents: 500,
    color: 'white'
  });
  this.addNotePosition({
    name: '   19-TET P4',
    ratio: Math.pow(2, 8/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 510,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 520,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean Wolf Fourth (177147/131072)',
    ratio: 177147/131072,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 530,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal Augmented Fourth (15/11)',
    ratio: 15/11,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 540,
    color: 'gray'
  });
  this.addNotePosition({
    name: '550¢',
    cents: 550,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 560,
    color: 'gray'
  });
  this.addNotePosition({
    name: '      Undecimal (11/8)',
    ratio: 11/8,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '17-TET d5',
    ratio: Math.pow(2, 8/17),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '19-TET A4',
    ratio: Math.pow(2, 9/19),
    color: 'gray'
  });
  this.addNotePosition({
    name: '                      Low A4 (25/18)',
    ratio: 25/18,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 570,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 580,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (7/5)',
    ratio: 7/5,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'Pythagorean d5 (1024/729)',
    ratio: 1024/729,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 590,
    color: 'gray'
  });
  this.addNotePosition({
    name: '   Pure A4 (45/32)',
    ratio: 45/32,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'A4/d5, 600¢',
    cents: 600,
    color: 'black'
  });
  this.addNotePosition({
    name: 'Pure d5 (64/45)    ',
    ratio: 64/45,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 610,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean A4 (729/512)',
    ratio: 729/512,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (10/7)',
    ratio: 10/7,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 620,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 630,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'High d5 (36/25)                      ',
    ratio: 36/25,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '19-TET d5',
    ratio: Math.pow(2, 10/19),
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A4',
    ratio: Math.pow(2, 9/17),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 640,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (16/11)       ',
    ratio: 16/11,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '650¢',
    cents: 650,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 660,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 670,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean Wolf Fifth (262144/177157)',
    ratio: 262144/177157,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 680,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 690,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET P5  ', // this is stupid but necessary to avoid text collisions
    ratio: Math.pow(2, 11/19),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'P5, 700¢',
    cents: 700,
    color: 'white',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'Pure Fifth (3/2)',
    ratio: 3/2,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 710,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET P5',
    ratio: Math.pow(2, 10/17),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 720,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 730,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 740,
    color: 'gray'
  });
  this.addNotePosition({
    name: '750¢',
    cents: 750,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET A5',
    ratio: Math.pow(2, 12/19),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 760,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (14/9)',
    ratio: 14/9,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 770,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Augmented Fifth (25/16)          ',
    ratio: 25/16,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '17-TET m6',
    ratio: Math.pow(2, 11/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 780,
    color: 'gray'
  });
  this.addNotePosition({
    name: '          Undecimal (11/7)',
    ratio: 11/7,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 790,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pyth. m6 (128/81)    ',
    ratio: 128/81,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'A5/m6, 800¢',
    cents: 800,
    color: 'black'
  });
  this.addNotePosition({
    cents: 810,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Minor Sixth (8/5)      ',
    ratio: 8/5,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean Augmented Fifth (6561/4096)',
    ratio: 6561/4096,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 820,
    color: 'gray'
  });
  this.addNotePosition({
    name: '      19-TET m6',
    ratio: Math.pow(2, 13/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 830,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 840,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A5',
    ratio: Math.pow(2, 12/17),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '850¢',
    cents: 850,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 860,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 870,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 880,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET M6',
    ratio: Math.pow(2, 14/19),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure Major Sixth (5/3)',
    ratio: 5/3,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 890,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'M6/d7, 900¢',
    cents: 900,
    color: 'white'
  });
  this.addNotePosition({
    name: 'Pythagorean Major Sixth (27/16)',
    ratio: 27/16,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 910,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET M6',
    ratio: Math.pow(2, 13/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 920,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 930,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (12/7)',
    ratio: 12/7,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 940,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET A6',
    ratio: Math.pow(2, 15/19),
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '950¢',
    cents: 950,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Small Pure A6 (125/72)',
    ratio: 125/72,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 960,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (7/4)',
    ratio: 7/4,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 970,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Large Pure A6 (225/128)',
    ratio: 225/128,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 980,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET m7',
    ratio: Math.pow(2, 14/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 990,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean m7 (16/9)',
    ratio: 16/9,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'A6/m7, 1000¢',
    cents: 1000,
    color: 'black'
  });
  this.addNotePosition({
    cents: 1010,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET m7',
    ratio: Math.pow(2, 16/19),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure m7 (9/5)',
    ratio: 9/5,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean A6 (59049/32768)',
    ratio: 59049/32768,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1020,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1030,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (20/11)',
    ratio: 20/11,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1040,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (11/6)          ',
    ratio: 11/6,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '1050¢',
    cents: 1050,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A6',
    ratio: Math.pow(2, 15/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1060,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Grave M7 (50/27)',
    ratio: 50/27,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1070,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET M7',
    ratio: Math.pow(2, 17/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1080,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean d8 (4096/2187)',
    ratio: 4096/2187,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'Pure M7 (15/8)',
    ratio: 15/8,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1090,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'M7/d8, 1100¢',
    cents: 1100,
    color: 'white'
  });
  this.addNotePosition({
    name: 'Narrow d8 (256/135)',
    ratio: 256/135,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '         Pythagorean M7 (243/128)',
    ratio: 243/128,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1110,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1120,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET M7',
    ratio: Math.pow(2, 16/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Classic d8 (48/25)',
    ratio: 48/25,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1130,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET d8',
    ratio: Math.pow(2, 18/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1140,
    color: 'gray'
  });
  this.addNotePosition({
    name: '1150¢',
    cents: 1150,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure A7 (125/64)',
    ratio: 125/64,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1160,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1170,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Octave – Syntonic (160/81)',
    ratio: 160/81,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1180,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1190,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'P8, 1200¢ (2/1)',
    cents: 1200,
    color: 'white'
  });
  this.addNotePosition({
    cents: 1210,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1220,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean A7 (531441/262144)',
    ratio: 531441/262144,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1230,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1240,
    color: 'gray'
  });
  this.addNotePosition({
    name: '1250¢',
    cents: 1250,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1260,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET A8',
    ratio: Math.pow(2, 20/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1270,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET m9',
    ratio: Math.pow(2, 18/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Minor A8 (25/12)',
    ratio: 25/12,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1280,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1290,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean m9 (512/243)        ',
    ratio: 512/243,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Major A8 (135/64)',
    ratio: 135/64,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: 'A8/m9, 1300¢',
    cents: 1300,
    color: 'black'
  });
  this.addNotePosition({
    cents: 1310,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pure m9 (32/15)',
    ratio: 32/15,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Pythagorean A8 (2187/1024)',
    ratio: 2187/1024,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1320,
    color: 'gray'
  });
  this.addNotePosition({
    name: '19-TET m9',
    ratio: Math.pow(2, 21/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1330,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1340,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET A8',
    ratio: Math.pow(2, 19/17),
    color: 'gray'
  });
  this.addNotePosition({
    name: '1350¢',
    cents: 1350,
    color: 'gray'
  });
  this.addNotePosition({
    name: '             Undecimal (24/11)',
    ratio: 24/11,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1360,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Undecimal (11/5)',
    ratio: 11/5,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1370,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1380,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Minor M9 (20/9)',
    ratio: 20/9,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    name: '19-TET M9',
    ratio: Math.pow(2, 22/19),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1390,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'M9, 1400¢',
    cents: 1400,
    color: 'white'
  });
  this.addNotePosition({
    name: 'Major M9 (9/4)',
    ratio: 9/4,
    color: 'gray',
    yOffset: -13
  });
  this.addNotePosition({
    cents: 1410,
    color: 'gray'
  });
  this.addNotePosition({
    name: '17-TET M9',
    ratio: Math.pow(2, 20/17),
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1420,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1430,
    color: 'gray'
  });
  this.addNotePosition({
    name: 'Septimal (16/7)',
    ratio: 16/7,
    color: 'gray'
  });
  this.addNotePosition({
    cents: 1440,
    color: 'gray'
  });
  this.addNotePosition({
    name: '1450¢',
    cents: 1450,
    color: 'gray'
  });
  for (let i = -2; i <= 64; i++) {
    this.addNotePosition({
      cents: (1200/53)*i,
      color: 'gray',
      lowerName: '' + i + ' k'
    });
  }
};