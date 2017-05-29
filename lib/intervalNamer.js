function IntervalNamer(canvas) {
  let self = this;

  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.sprites = new Image();
  this.sprites.onload = function () {
    self.stop();
  }
  this.sprites.src = '../png/4/Sprite Sheet 1.png';
  this.rowY = [0, 265, 400, 535, 670, 805, 940];
  this.noteH = 117;
  this.clefPositions = null; // width: 43
  this.notePositions = []; // two widest: 74, 73; max total width: 190; height: 117
  this.intervals = {
    bass: [],
    treble: []
  };
  this.setupClefs();
  this.setupNotes();
  this.setupIntervals();

  this.clefMode = 'both'; // can be 'treble', 'bass', or 'both'

  this.frame = 0;
  this.interval = null;
  this.intervalName = '';

  this.windowInterval = null;

  this.playing = null; // becomes false when stop is called
}

IntervalNamer.prototype.start = function () {
  let self = this;
  this.frame = 0;
  this.playing = true;
  this.windowInterval = window.setInterval(self.play.bind(self), 1000);
}

IntervalNamer.prototype.stop = function () {
  this.playing = false;
  window.clearInterval(this.windowInterval);
  this.clear();
  this.drawStopBanner();
}

IntervalNamer.prototype.play = function () {
  if (!this.playing) {
    return;
  }
  if (this.frame === 0) {
    this.interval = this.chooseNotes();
    this.intervalName = intervalName(this.interval.note1, this.interval.note2, true);
    this.clear();
    this.drawInterval();
  } else if (this.frame === 1) {
    this.drawDot(1);
  } else if (this.frame === 2) {
    this.drawDot(2);
  } else if (this.frame === 3) {
    this.drawDot(3);
  } else if (this.frame === 4) {
    this.drawDot(4);
  } else if (this.frame === 5) {
    this.drawAnswer();
  }
  this.frame++;
  if (this.frame === 7) {
    this.frame = 0;
  }
};

IntervalNamer.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('click', function (e) {
    return self.onClick(e);
  }, false);
};

IntervalNamer.prototype.onClick = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this.playing === true) {
    this.stop();
  } else if (this.playing === false) {
    this.start();
    this.play(); // start sets an interval so there's a delay; start immediately
  }
};

IntervalNamer.prototype.chooseNotes = function () {
  let interval = this.chooseInterval();
  let acc1 = this.chooseAccidental();
  let acc2 = this.chooseAccidental();
  return {
    clef: interval.clef,
    note1: interval.note1.substr(0, 1) + acc1 + interval.note1.substr(1),
    note2: interval.note2.substr(0, 1) + acc2 + interval.note2.substr(1)
  };
};

IntervalNamer.prototype.chooseClef = function () {
  let clefName = this.clefMode;
  if (clefName === 'both') {
    if (Math.random() < 0.5) {
      clefName = 'treble';
    } else {
      clefName = 'bass';
    }
  }
  return clefName;
}

IntervalNamer.prototype.chooseInterval = function () {
  let clefName = this.chooseClef();
  let nIntervals = this.intervals[clefName].length;
  let r = Math.floor(Math.random()*nIntervals);
  let interval = this.intervals[clefName][r];
  return {
    clef: clefName,
    note1: interval.note1,
    note2: interval.note2
  };
};

IntervalNamer.prototype.chooseAccidental = function () {
  let r = Math.random();
  if (r < 0.6) {
    return '';
  } else if (r < 0.75) {
    return 'b';
  } else if (r < 0.9) {
    return '#';
  } else if (r < 0.95) {
    return 'bb';
  } else {
    return 'x';
  }
};

IntervalNamer.prototype.clear = function () {
  let ctx = this.ctx;
  ctx.clearRect(0, 0, 220, 200);
};

IntervalNamer.prototype.drawAnswer = function () {
  let ctx = this.ctx;
  ctx.textAlign = 'center';
  ctx.font = '32px serif';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillText(this.intervalName, 110, 186);
};

IntervalNamer.prototype.drawDot = function (dot) {
  let ctx = this.ctx;

  let x = 10 + 51*(dot - 1);
  let y = 2;
  let w = 47;
  let h = 25;

  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgb(128, 128, 255)';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgb(64, 64, 255)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
};

IntervalNamer.prototype.drawStopBanner = function () {
  let ctx = this.ctx;

  let x = 8;
  let y = 1.5;
  let w = 204;
  let h = 197;

  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgb(128, 128, 255)';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgb(64, 64, 255)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = 'center';
  ctx.font = '64px serif';
  ctx.fillStyle = 'rgb(238, 238, 238)';
  ctx.fillText('Click', 110, 70);
  ctx.fillText('to', 110, 120);
  ctx.fillText('start', 110, 170);
};

IntervalNamer.prototype.drawInterval = function () {
  let ctx = this.ctx;
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fillRect(10, 31, 200, 121);
  ctx.strokeStyle = 'rgb(128, 128, 255)';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 31, 200, 121);
  ctx.strokeStyle = 'rgb(64, 64, 255)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 31, 200, 121);
  let interval = this.interval;
  let clefName = interval.clef;
  let note1Name = interval.note1;
  let note2Name = interval.note2;
  let clef = this.clefPositions[clefName];
  let note1 = this.getNotePosition(clefName, note1Name);
  let note2 = this.getNotePosition(clefName, note2Name);
  let totalWidth = clef.w + note1.w + note2.w;
  let startingX = 110 - totalWidth/2.0;
  ctx.drawImage(this.sprites, clef.x, clef.y, clef.w, clef.h, startingX, 32.5, clef.w, clef.h);
  ctx.drawImage(this.sprites, note1.x, note1.y, note1.w, note1.h, startingX + clef.w, 32.5, note1.w, note1.h);
  ctx.drawImage(this.sprites, note2.x, note2.y, note2.w, note2.h, startingX + clef.w + note1.w, 32.5, note2.w, note2.h);
};

IntervalNamer.prototype.getNotePosition = function (clefName, noteName) {
  return this.notePositions.filter(function (note) {
    return note[clefName + 'Name'] === noteName;
  })[0];
}

IntervalNamer.prototype.setupClefs = function () {
  let treble = {
    x: 107,
    y: this.rowY[1],
    w: 43,
    h: this.noteH
  };
  let bass = {
    x: 107,
    y: this.rowY[5],
    w: 43,
    h: this.noteH
  };
  this.clefPositions = {
    treble: treble,
    bass: bass
  };
};

IntervalNamer.prototype.setupNotes = function () {
  // row 1
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[1],
    w: 223 - 151,
    h: this.noteH,
    trebleName: 'Gbb3',
    bassName: 'Bbb1'
  });
  this.notePositions.push({
    x: 224,
    y: this.rowY[1],
    w: 288 - 224,
    h: this.noteH,
    trebleName: 'Gb3',
    bassName: 'Bb1'
  });
  this.notePositions.push({
    x: 288,
    y: this.rowY[1],
    w: 351 - 288,
    h: this.noteH,
    trebleName: 'G3',
    bassName: 'B1'
  });
  this.notePositions.push({
    x: 352,
    y: this.rowY[1],
    w: 417 - 352,
    h: this.noteH,
    trebleName: 'G#3',
    bassName: 'B#1'
  });
  this.notePositions.push({
    x: 417,
    y: this.rowY[1],
    w: 483 - 417,
    h: this.noteH,
    trebleName: 'Gx3',
    bassName: 'Bx1'
  });
  this.notePositions.push({
    x: 484,
    y: this.rowY[1],
    w: 556 - 484,
    h: this.noteH,
    trebleName: 'Abb3',
    bassName: 'Cbb2'
  });
  this.notePositions.push({
    x: 556,
    y: this.rowY[1],
    w: 621 - 556,
    h: this.noteH,
    trebleName: 'Ab3',
    bassName: 'Cb2'
  });
  this.notePositions.push({
    x: 621,
    y: this.rowY[1],
    w: 684 - 621,
    h: this.noteH,
    trebleName: 'A3',
    bassName: 'C2'
  });
  this.notePositions.push({
    x: 684,
    y: this.rowY[1],
    w: 750 - 684,
    h: this.noteH,
    trebleName: 'A#3',
    bassName: 'C#2'
  });
  this.notePositions.push({
    x: 750,
    y: this.rowY[1],
    w: 816 - 750,
    h: this.noteH,
    trebleName: 'Ax3',
    bassName: 'Cx2'
  });
  this.notePositions.push({
    x: 816,
    y: this.rowY[1],
    w: 889 - 816,
    h: this.noteH,
    trebleName: 'Bbb3',
    bassName: 'Dbb2'
  });
  this.notePositions.push({
    x: 889,
    y: this.rowY[1],
    w: 953 - 889,
    h: this.noteH,
    trebleName: 'Bb3',
    bassName: 'Db2'
  });
  this.notePositions.push({
    x: 954,
    y: this.rowY[1],
    w: 1017 - 954,
    h: this.noteH,
    trebleName: 'B3',
    bassName: 'D2'
  });
  this.notePositions.push({
    x: 1017,
    y: this.rowY[1],
    w: 1082 - 1017,
    h: this.noteH,
    trebleName: 'B#3',
    bassName: 'D#2'
  });
  this.notePositions.push({
    x: 1083,
    y: this.rowY[1],
    w: 1149 - 1083,
    h: this.noteH,
    trebleName: 'Bx3',
    bassName: 'Dx2'
  });

  // row 2
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[2],
    w: 225 - 151,
    h: this.noteH,
    trebleName: 'Cbb4',
    bassName: 'Ebb2'
  });
  this.notePositions.push({
    x: 225,
    y: this.rowY[2],
    w: 291 - 225,
    h: this.noteH,
    trebleName: 'Cb4',
    bassName: 'Eb2'
  });
  this.notePositions.push({
    x: 291,
    y: this.rowY[2],
    w: 355 - 291,
    h: this.noteH,
    trebleName: 'C4',
    bassName: 'E2'
  });
  this.notePositions.push({
    x: 356,
    y: this.rowY[2],
    w: 422 - 356,
    h: this.noteH,
    trebleName: 'C#4',
    bassName: 'E#2'
  });
  this.notePositions.push({
    x: 423,
    y: this.rowY[2],
    w: 490 - 423,
    h: this.noteH,
    trebleName: 'Cx4',
    bassName: 'Ex2'
  });
  this.notePositions.push({
    x: 490,
    y: this.rowY[2],
    w: 562 - 490,
    h: this.noteH,
    trebleName: 'Dbb4',
    bassName: 'Fbb2'
  });
  this.notePositions.push({
    x: 562,
    y: this.rowY[2],
    w: 626 - 562,
    h: this.noteH,
    trebleName: 'Db4',
    bassName: 'Fb2'
  });
  this.notePositions.push({
    x: 628,
    y: this.rowY[2],
    w: 690 - 628,
    h: this.noteH,
    trebleName: 'D4',
    bassName: 'F2'
  });
  this.notePositions.push({
    x: 690,
    y: this.rowY[2],
    w: 754 - 690,
    h: this.noteH,
    trebleName: 'D#4',
    bassName: 'F#2'
  });
  this.notePositions.push({
    x: 755,
    y: this.rowY[2],
    w: 819 - 755,
    h: this.noteH,
    trebleName: 'Dx4',
    bassName: 'Fx2'
  });
  this.notePositions.push({
    x: 820,
    y: this.rowY[2],
    w: 891 - 820,
    h: this.noteH,
    trebleName: 'Ebb4',
    bassName: 'Gbb2'
  });
  this.notePositions.push({
    x: 892,
    y: this.rowY[2],
    w: 955 - 892,
    h: this.noteH,
    trebleName: 'Eb4',
    bassName: 'Gb2'
  });
  this.notePositions.push({
    x: 957,
    y: this.rowY[2],
    w: 1019 - 957,
    h: this.noteH,
    trebleName: 'E4',
    bassName: 'G2'
  });
  this.notePositions.push({
    x: 1019,
    y: this.rowY[2],
    w: 1083 - 1019,
    h: this.noteH,
    trebleName: 'E#4',
    bassName: 'G#2'
  });
  this.notePositions.push({
    x: 1084,
    y: this.rowY[2],
    w: 1149 - 1084,
    h: this.noteH,
    trebleName: 'Ex4',
    bassName: 'Gx2'
  });

  // row 3
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[3],
    w: 223 - 151,
    h: this.noteH,
    trebleName: 'Fbb4',
    bassName: 'Abb2'
  });
  this.notePositions.push({
    x: 223,
    y: this.rowY[3],
    w: 287 - 223,
    h: this.noteH,
    trebleName: 'Fb4',
    bassName: 'Ab2'
  });
  this.notePositions.push({
    x: 290,
    y: this.rowY[3],
    w: 352 - 290,
    h: this.noteH,
    trebleName: 'F4',
    bassName: 'A2'
  });
  this.notePositions.push({
    x: 352,
    y: this.rowY[3],
    w: 417 - 352,
    h: this.noteH,
    trebleName: 'F#4',
    bassName: 'A#2'
  });
  this.notePositions.push({
    x: 418,
    y: this.rowY[3],
    w: 483 - 418,
    h: this.noteH,
    trebleName: 'Fx4',
    bassName: 'Ax2'
  });
  this.notePositions.push({
    x: 484,
    y: this.rowY[3],
    w: 556 - 484,
    h: this.noteH,
    trebleName: 'Gbb4',
    bassName: 'Bbb2'
  });
  this.notePositions.push({
    x: 556,
    y: this.rowY[3],
    w: 620 - 556,
    h: this.noteH,
    trebleName: 'Gb4',
    bassName: 'Bb2'
  });
  this.notePositions.push({
    x: 622,
    y: this.rowY[3],
    w: 685 - 622,
    h: this.noteH,
    trebleName: 'G4',
    bassName: 'B2'
  });
  this.notePositions.push({
    x: 685,
    y: this.rowY[3],
    w: 750 - 685,
    h: this.noteH,
    trebleName: 'G#4',
    bassName: 'B#2'
  });
  this.notePositions.push({
    x: 750,
    y: this.rowY[3],
    w: 816 - 750,
    h: this.noteH,
    trebleName: 'Gx4',
    bassName: 'Bx2'
  });
  this.notePositions.push({
    x: 816,
    y: this.rowY[3],
    w: 888 - 816,
    h: this.noteH,
    trebleName: 'Abb4',
    bassName: 'Cbb3'
  });
  this.notePositions.push({
    x: 889,
    y: this.rowY[3],
    w: 953 - 889,
    h: this.noteH,
    trebleName: 'Ab4',
    bassName: 'Cb3'
  });
  this.notePositions.push({
    x: 955,
    y: this.rowY[3],
    w: 1017 - 955,
    h: this.noteH,
    trebleName: 'A4',
    bassName: 'C3'
  });
  this.notePositions.push({
    x: 1018,
    y: this.rowY[3],
    w: 1083 - 1018,
    h: this.noteH,
    trebleName: 'A#4',
    bassName: 'C#3'
  });
  this.notePositions.push({
    x: 1084,
    y: this.rowY[3],
    w: 1149 - 1084,
    h: this.noteH,
    trebleName: 'Ax4',
    bassName: 'Cx3'
  });

  // row 4
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[4],
    w: 223 - 151,
    h: this.noteH,
    trebleName: 'Bbb4',
    bassName: 'Dbb3'
  });
  this.notePositions.push({
    x: 223,
    y: this.rowY[4],
    w: 287 - 223,
    h: this.noteH,
    trebleName: 'Bb4',
    bassName: 'Db3'
  });
  this.notePositions.push({
    x: 289,
    y: this.rowY[4],
    w: 351 - 289,
    h: this.noteH,
    trebleName: 'B4',
    bassName: 'D3'
  });
  this.notePositions.push({
    x: 352,
    y: this.rowY[4],
    w: 416 - 352,
    h: this.noteH,
    trebleName: 'B#4',
    bassName: 'D#3'
  });
  this.notePositions.push({
    x: 417,
    y: this.rowY[4],
    w: 482 - 417,
    h: this.noteH,
    trebleName: 'Bx4',
    bassName: 'Dx3'
  });
  this.notePositions.push({
    x: 482,
    y: this.rowY[4],
    w: 554 - 482,
    h: this.noteH,
    trebleName: 'Cbb5',
    bassName: 'Ebb3'
  });
  this.notePositions.push({
    x: 554,
    y: this.rowY[4],
    w: 618 - 554,
    h: this.noteH,
    trebleName: 'Cb5',
    bassName: 'Eb3'
  });
  this.notePositions.push({
    x: 621,
    y: this.rowY[4],
    w: 682 - 621,
    h: this.noteH,
    trebleName: 'C5',
    bassName: 'E3'
  });
  this.notePositions.push({
    x: 683,
    y: this.rowY[4],
    w: 748 - 683,
    h: this.noteH,
    trebleName: 'C#5',
    bassName: 'E#3'
  });
  this.notePositions.push({
    x: 748,
    y: this.rowY[4],
    w: 813 - 748,
    h: this.noteH,
    trebleName: 'Cx5',
    bassName: 'Ex3'
  });
  this.notePositions.push({
    x: 814,
    y: this.rowY[4],
    w: 886 - 814,
    h: this.noteH,
    trebleName: 'Dbb5',
    bassName: 'Fbb3'
  });
  this.notePositions.push({
    x: 886,
    y: this.rowY[4],
    w: 950 - 886,
    h: this.noteH,
    trebleName: 'Db5',
    bassName: 'Fb3'
  });
  this.notePositions.push({
    x: 952,
    y: this.rowY[4],
    w: 1014 - 952,
    h: this.noteH,
    trebleName: 'D5',
    bassName: 'F3'
  });
  this.notePositions.push({
    x: 1015,
    y: this.rowY[4],
    w: 1079 - 1015,
    h: this.noteH,
    trebleName: 'D#5',
    bassName: 'F#3'
  });
  this.notePositions.push({
    x: 1080,
    y: this.rowY[4],
    w: 1149 - 1080,
    h: this.noteH,
    trebleName: 'Dx5',
    bassName: 'Fx3'
  });

  // row 5
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[5],
    w: 223 - 151,
    h: this.noteH,
    trebleName: 'Ebb5',
    bassName: 'Gbb3'
  });
  this.notePositions.push({
    x: 223,
    y: this.rowY[5],
    w: 287 - 223,
    h: this.noteH,
    trebleName: 'Eb5',
    bassName: 'Gb3'
  });
  this.notePositions.push({
    x: 289,
    y: this.rowY[5],
    w: 351 - 289,
    h: this.noteH,
    trebleName: 'E5',
    bassName: 'G3'
  });
  this.notePositions.push({
    x: 352,
    y: this.rowY[5],
    w: 416 - 352,
    h: this.noteH,
    trebleName: 'E#5',
    bassName: 'G#3'
  });
  this.notePositions.push({
    x: 417,
    y: this.rowY[5],
    w: 482 - 417,
    h: this.noteH,
    trebleName: 'Ex5',
    bassName: 'Gx3'
  });
  this.notePositions.push({
    x: 482,
    y: this.rowY[5],
    w: 554 - 482,
    h: this.noteH,
    trebleName: 'Fbb5',
    bassName: 'Abb3'
  });
  this.notePositions.push({
    x: 554,
    y: this.rowY[5],
    w: 618 - 554,
    h: this.noteH,
    trebleName: 'Fb5',
    bassName: 'Ab3'
  });
  this.notePositions.push({
    x: 621,
    y: this.rowY[5],
    w: 683 - 621,
    h: this.noteH,
    trebleName: 'F5',
    bassName: 'A3'
  });
  this.notePositions.push({
    x: 684,
    y: this.rowY[5],
    w: 748 - 684,
    h: this.noteH,
    trebleName: 'F#5',
    bassName: 'A#3'
  });
  this.notePositions.push({
    x: 748,
    y: this.rowY[5],
    w: 813 - 748,
    h: this.noteH,
    trebleName: 'Fx5',
    bassName: 'Ax3'
  });
  this.notePositions.push({
    x: 814,
    y: this.rowY[5],
    w: 886 - 814,
    h: this.noteH,
    trebleName: 'Gbb5',
    bassName: 'Bbb3'
  });
  this.notePositions.push({
    x: 886,
    y: this.rowY[5],
    w: 950 - 886,
    h: this.noteH,
    trebleName: 'Gb5',
    bassName: 'Bb3'
  });
  this.notePositions.push({
    x: 952,
    y: this.rowY[5],
    w: 1014 - 952,
    h: this.noteH,
    trebleName: 'G5',
    bassName: 'B3'
  });
  this.notePositions.push({
    x: 1015,
    y: this.rowY[5],
    w: 1079 - 1015,
    h: this.noteH,
    trebleName: 'G#5',
    bassName: 'B#3'
  });
  this.notePositions.push({
    x: 1080,
    y: this.rowY[5],
    w: 1149 - 1080,
    h: this.noteH,
    trebleName: 'Gx5',
    bassName: 'Bx3'
  });

  // row 6
  /*******************************************************************************/
  this.notePositions.push({
    x: 151,
    y: this.rowY[6],
    w: 223 - 151,
    h: this.noteH,
    trebleName: 'Abb5',
    bassName: 'Cbb4'
  });
  this.notePositions.push({
    x: 224,
    y: this.rowY[6],
    w: 288 - 224,
    h: this.noteH,
    trebleName: 'Ab5',
    bassName: 'Cb4'
  });
  this.notePositions.push({
    x: 288,
    y: this.rowY[6],
    w: 351 - 288,
    h: this.noteH,
    trebleName: 'A5',
    bassName: 'C4'
  });
  this.notePositions.push({
    x: 352,
    y: this.rowY[6],
    w: 417 - 352,
    h: this.noteH,
    trebleName: 'A#5',
    bassName: 'C#4'
  });
  this.notePositions.push({
    x: 417,
    y: this.rowY[6],
    w: 483 - 417,
    h: this.noteH,
    trebleName: 'Ax5',
    bassName: 'Cx4'
  });
  this.notePositions.push({
    x: 484,
    y: this.rowY[6],
    w: 556 - 484,
    h: this.noteH,
    trebleName: 'Bbb5',
    bassName: 'Dbb4'
  });
  this.notePositions.push({
    x: 556,
    y: this.rowY[6],
    w: 621 - 556,
    h: this.noteH,
    trebleName: 'Bb5',
    bassName: 'Db4'
  });
  this.notePositions.push({
    x: 621,
    y: this.rowY[6],
    w: 684 - 621,
    h: this.noteH,
    trebleName: 'B5',
    bassName: 'D4'
  });
  this.notePositions.push({
    x: 684,
    y: this.rowY[6],
    w: 750 - 684,
    h: this.noteH,
    trebleName: 'B#5',
    bassName: 'D#4'
  });
  this.notePositions.push({
    x: 750,
    y: this.rowY[6],
    w: 816 - 750,
    h: this.noteH,
    trebleName: 'Bx5',
    bassName: 'Dx4'
  });
  this.notePositions.push({
    x: 816,
    y: this.rowY[6],
    w: 889 - 816,
    h: this.noteH,
    trebleName: 'Cbb6',
    bassName: 'Ebb4'
  });
  this.notePositions.push({
    x: 889,
    y: this.rowY[6],
    w: 953 - 889,
    h: this.noteH,
    trebleName: 'Cb6',
    bassName: 'Eb4'
  });
  this.notePositions.push({
    x: 954,
    y: this.rowY[6],
    w: 1017 - 954,
    h: this.noteH,
    trebleName: 'C6',
    bassName: 'E4'
  });
  this.notePositions.push({
    x: 1017,
    y: this.rowY[6],
    w: 1082 - 1017,
    h: this.noteH,
    trebleName: 'C#6',
    bassName: 'E#4'
  });
  this.notePositions.push({
    x: 1083,
    y: this.rowY[6],
    w: 1149 - 1080,
    h: this.noteH,
    trebleName: 'Cx6',
    bassName: 'Ex4'
  });
};

IntervalNamer.prototype.setupIntervals = function () {
  const trebleNotes = ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
  const bassNotes = ['B1', 'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'];
  for (let i = 1; i <= 9; i++) {
    for (let t = 0; t <= trebleNotes.length - i; t++) {
      this.intervals.treble.push({
        note1: trebleNotes[t],
        note2: trebleNotes[t + i - 1]
      });
    }
    for (let b = 0; b <= bassNotes.length - i; b++) {
      this.intervals.bass.push({
        note1: bassNotes[b],
        note2: bassNotes[b + i - 1]
      });
    }
  }
};