function ScaleKeyboard(div) {
  this.div = div;
  this.setupHtml();
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.keys = [];
  this.tight = false;
  this.topRowsComputerKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  this.bottomRowsComputerKeys = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/',
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''].reverse();

  this.left = 10;
  this.right = 790;

  let gap = 10;
  let top = 65;
  let bottom = 800 - gap;
  this.nRows = 4; // this maybe could change later
  let rowWidth = (bottom - top - (this.nRows - 1)*gap)/this.nRows;
  let visualizerGap = rowWidth*0.33;
  this.rows = []; // row 0 is bottom row; nRows total
  for (let i = 0; i < this.nRows; i++) {
    this.rows.push({
      top: top + (this.nRows - i - 1)*gap + (this.nRows - 1 - i)*rowWidth,
      bottom: top + (this.nRows - i - 1)*gap + (this.nRows - i)*rowWidth - visualizerGap,
      visualizerLine: top + (this.nRows - i - 1)*gap + (this.nRows - i)*rowWidth - visualizerGap/2,
      lowFreq: null,
      highFreq: null
    });
  }

  let mode = this.modeSelect.options[this.modeSelect.selectedIndex].text;
  let tonic = this.tonicSelect.options[this.tonicSelect.selectedIndex].text;

  this.setupKeys(mode, tonic);
}

ScaleKeyboard.prototype.setupHtml = function () {
  this.canvas = document.createElement('canvas');
  this.canvas.height = 800;
  this.canvas.width = 800;
  this.div.appendChild(this.canvas);

  this.modeSelect = document.createElement('select');
  this.modeSelect.style.position = 'absolute';
  this.modeSelect.style.top = '10px';
  this.modeSelect.style.left = '600px';
  this.modeSelect.style.width = '190px';
  this.div.appendChild(this.modeSelect);

  let modes = Object.keys(ScaleKeyboard.modes);
  for (let i = 0; i < modes.length; i++) {
    let option = document.createElement('option');
    option.value = modes[i];
    option.innerHTML = modes[i];
    if (modes[i] === 'Major') {
      option.selected = true;
    }
    this.modeSelect.appendChild(option);
  }

  this.tonicSelect = document.createElement('select');
  this.tonicSelect.style.position = 'absolute';
  this.tonicSelect.style.top = '36px';
  this.tonicSelect.style.left = '600px';
  this.tonicSelect.style.width = '190px';
  this.div.appendChild(this.tonicSelect);

  let tonics = Object.keys(ScaleKeyboard.modes[this.modeSelect.options[this.modeSelect.selectedIndex].text]);
  for (let i = 0; i < tonics.length; i++) {
    let option = document.createElement('option');
    option.value = tonics[i];
    option.innerHTML = tonics[i];
    if (tonics[i] === 'C') {
      option.selected = true;
    }
    this.tonicSelect.appendChild(option);
  }
};

ScaleKeyboard.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

ScaleKeyboard.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].stop();
  }
  this.draw();
};

ScaleKeyboard.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
  // canvas won't receive keyboard events anyway, so get them in the document and route them to the active keyboard

  this.modeSelect.onchange = function (e) {
    return self.onModeSelect(e);
  };
  this.tonicSelect.onchange = function (e) {
    return self.onTonicSelect(e);
  }
};

ScaleKeyboard.prototype.onMouseDown = function (e) {
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

ScaleKeyboard.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let key = this.getKeyFromClick(x, y);
  if (key !== null) {
    key.stop();
  }
};

ScaleKeyboard.prototype.onKeyDown = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.play();
  }
};

ScaleKeyboard.prototype.onKeyUp = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.stop();
  }
};

ScaleKeyboard.prototype.onModeSelect = function (e) {
  let mode = this.modeSelect.options[this.modeSelect.selectedIndex].text;
  let tonic = this.tonicSelect.options[this.tonicSelect.selectedIndex].text;

  while (this.tonicSelect.firstChild) {
    this.tonicSelect.removeChild(this.tonicSelect.firstChild);
  }

  let tonics = Object.keys(ScaleKeyboard.modes[mode]);
  for (let i = 0; i < tonics.length; i++) {
    let option = document.createElement('option');
    option.value = tonics[i];
    option.innerHTML = tonics[i];
    if ((tonics.indexOf(tonic) === -1 && tonics[i] === 'C') || (tonics.indexOf(tonic) !== -1 && tonics[i] === tonic)) {
      option.selected = true;
    }
    this.tonicSelect.appendChild(option);
  }

  tonic = this.tonicSelect.options[this.tonicSelect.selectedIndex].text;
  this.setupKeys(mode, tonic);
};

ScaleKeyboard.prototype.onTonicSelect = function (e) {
  let mode = this.modeSelect.options[this.modeSelect.selectedIndex].text;
  let tonic = this.tonicSelect.options[this.tonicSelect.selectedIndex].text;
  this.setupKeys(mode, tonic);
};

ScaleKeyboard.prototype.draw = function () {
  let ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(800, 0);
  ctx.lineTo(800, 800);
  ctx.lineTo(0, 800);
  ctx.lineTo(0, 0);
  ctx.closePath();
  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fill();

  ctx.strokeStyle = 'rgb(0, 0, 0)';
  ctx.lineWidth = 3;
  let r = 15; // circle radius
  if (this.tight) {
    r = 11;
  }
  for (let i = 0; i < this.rows.length; i++) {
    ctx.beginPath();
    ctx.moveTo(this.left + r, this.rows[i].visualizerLine);
    ctx.lineTo(this.right - r, this.rows[i].visualizerLine);
    ctx.stroke();
  }
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].draw();
    let freq = this.keys[i].frequency;
    let octavesAboveC0 = Math.log(freq/C0)/(Math.log(2)); // octave-based
    let pitchClass = (octavesAboveC0 - Math.floor(octavesAboveC0));
    let color = 'hsl(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%)';
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.lineWidth = 3;
    let row = this.keys[i].row;
    let wayAcrossFactor = freq/this.rows[row].lowFreq;
    let proportion = (Math.log(wayAcrossFactor)/Math.log(this.rows[row].highFreq/this.rows[row].lowFreq));
    let x = (this.right - this.left - 2*r)*proportion + this.left + r;

    ctx.beginPath();
    ctx.moveTo((this.keys[i].bounds.left + this.keys[i].bounds.right)/2, this.rows[row].bottom + 1);
    ctx.lineTo((this.keys[i].bounds.left + this.keys[i].bounds.right)/2, this.rows[row].bottom + (r - 1)/2);
    ctx.lineTo(x, this.rows[row].visualizerLine - (r - 1)/2);
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, this.rows[row].visualizerLine, r, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.stroke();
  }

  let mode = this.modeSelect.options[this.modeSelect.selectedIndex].text;
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.font = '48px serif';
  ctx.textAlign = 'left';
  ctx.fillText(ScaleKeyboard.scaleDegrees[mode].text, 10, 48);
};

ScaleKeyboard.prototype.getKeyFromClick = function (x, y) {
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.bounds.top < y && key.bounds.bottom > y && key.bounds.left < x && key.bounds.right > x) {
      return key;
    }
  }
  return null;
};

ScaleKeyboard.prototype.getKeyFromComputerKey = function (computerKey) {
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.computerKey !== null && key.computerKey === computerKey) {
      return key;
    }
  }
  return null;
}

ScaleKeyboard.prototype.setupKeys = function (mode, tonic) {
  this.keys = []; // delete previous keys

  let hasComputerKey = function (e) {
    if ('key' in e && e.key === null) {
      return false;
    }
    return true;
  };

  this.tight = false;
  if ('tight' in ScaleKeyboard.modes[mode]) {
    this.tight = ScaleKeyboard.modes[mode].tight;
  }

  let rows = ScaleKeyboard.modes[mode][tonic].rows;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < rows[i].length; j++) {
      let bounds = {
        top: this.rows[i].top,
        bottom: this.rows[i].bottom,
        left: this.left + j*(this.right - this.left)/rows[i].length,
        right: this.left + (j + 1)*(this.right - this.left)/rows[i].length
      }
      let name = rows[i][j].name;
      let displayName = name;
      let frequency;
      if ('freq' in rows[i][j]) {
        frequency = rows[i][j].freq;
      } else {
        frequency = getNoteFrequency(name); // will need to edit this
      }
      if ('freqLimit' in rows[i][j]) {
        if (rows[i][j].freqLimit === 'low') {
          this.rows[i].lowFreq = frequency;
        } else if (rows[i][j].freqLimit === 'high') {
          this.rows[i].highFreq = frequency;
        }
      }

      let computerKey = null;
      if (hasComputerKey(rows[i][j])) {
        let count = 0;
        if (i === 2 || i === 3) {
          let end = rows[2].length;
          if (i === 2) {
            end = j;
          }
          for (let k = 0; k < end; k++) {
            if (hasComputerKey(rows[2][k])) {
              count++;
            }
          }
          if (i === 3) {
            for (let k = 0; k < j; k++) {
              if (hasComputerKey(rows[3][k])) {
                count++;
              }
            }
          }
          if (count < this.topRowsComputerKeys.length) {
            computerKey = this.topRowsComputerKeys[count];
          }
        } else {
          let end = 0;
          if (i === 1) {
            end = j + 1;
          }
          for (let k = rows[1].length - 1; k >= end; k--) {
            if (hasComputerKey(rows[1][k])) {
              count++;
            }
          }
          if (i === 0) {
            for (let k = rows[0].length - 1; k >= j + 1; k--) {
              if (hasComputerKey(rows[0][k])) {
                count++;
              }
            }
          }
          if (count < this.bottomRowsComputerKeys.length) {
            computerKey = this.bottomRowsComputerKeys[count];
          }
        }
      }
      if (rows[i][j].optional) {
        displayName = '(' + displayName + ')';
      }
      let key = new ScaleKey(bounds, frequency, displayName, computerKey, i);

      if (this.tight) {
        key.setSmallName();
      }

      if ('color' in rows[i][j]) {
        let color = rows[i][j].color;
        if (color === 'white') {
          key.setWhite();
        } else if (color === 'light') {
          key.setLight();
        } else if (color === 'gray') {
          key.setGray();
        } else if (color === 'grey') {
          key.setGrey();
        } else if (color === 'dark') {
          key.setDark();
        } else if (color === 'black') {
          key.setBlack();
        }
      } else {
        let parsed = parseNoteName(name);
        let accidental = parsed.accidental;
        let letter = parsed.letter;
        let whiteKeys = ['Cb', 'C', 'Cx', 'Dbb', 'D', 'Dx', 'Ebb', 'E', 'E#', 'Fb', 'F', 'Fx', 'Gbb', 'G', 'Gx', 'Abb', 'A', 'Ax', 'Bbb', 'B', 'B#'];
        let blackKeys = ['Cbb', 'C#', 'Db', 'D#', 'Eb', 'Ex', 'Fbb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb', 'Bx'];
        if (whiteKeys.indexOf(letter + accidental) !== -1) {
          if (rows[i][j].optional) {
            key.setLight();
          } else {
            key.setWhite();
          }
        } else if (blackKeys.indexOf(letter + accidental) !== -1) {
          if (rows[i][j].optional) {
            key.setDark();
          } else {
            key.setBlack();
          }
        } else {
          key.setGray();
        }
      }
      key.setKeyboard(this);
      this.keys.push(key);
    }
  }

  this.draw();
};

ScaleKeyboard.calculateStep = function (noteName, step) {
  let parsed = parseNoteName(noteName);
  let letter = parsed.letter;
  let accidental = parsed.accidental;
  let octave = parsed.octave;

  const accidentals = ['bbbb', 'dbbb', 'bbb', 'dbb', 'bb', 'db', 'b', 'd', '', 't', '#', '#t', 'x', 'xt', 'x#', 'x#t', 'xx'];
  let accidentalIndex = accidentals.indexOf(accidental);

  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  let letterIndex = letters.indexOf(letter);

  if (step === 'u') { // unison, C - C
    return letter + accidentals[accidentalIndex] + octave;
  } else if (step === 'c') { // chromatic semitone, C - C#
    return letter + accidentals[accidentalIndex + 2] + octave;
  } else if (step === 'q') { // chromatic quarter tone, C - Ct
    return letter + accidentals[accidentalIndex + 1] + octave;
  } else if (step === 'd') { // diatonic semitone, C - Db
    let newLetterIndex = letterIndex + 1;
    let newOctave = octave;
    if (newLetterIndex >= letters.length) {
      newOctave++;
      newLetterIndex -= letters.length;
    }
    let newAccidentalIndex = accidentalIndex;
    if (letter !== 'E' && letter !== 'B') {
      newAccidentalIndex -= 2;
    }
    return letters[newLetterIndex] + accidentals[newAccidentalIndex] + newOctave;
  } else if (step === 't') { // diatonic quarter tone, C - Ddb
    let newLetterIndex = letterIndex + 1;
    let newOctave = octave;
    if (newLetterIndex >= letters.length) {
      newOctave++;
      newLetterIndex -= letters.length;
    }
    let newAccidentalIndex = accidentalIndex - 1;
    if (letter !== 'E' && letter !== 'B') {
      newAccidentalIndex -= 2;
    }
    return letters[newLetterIndex] + accidentals[newAccidentalIndex] + newOctave;
  } else if (step === 'w') { // whole step, C - D
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'd'), 'c');
  } else if (step === 'a') { // augmented second, C - D#
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'c'), 'w');
  } else if (step === 'm3') { // minor third, C - Eb
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'd'), 'w');
  } else if (step === 'M3') { // major third, C - E
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'w'), 'w');
  } else if (step === 'd3') { // diminished third, C - Ebb
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'd'), 'd');
  } else if (step === 'n') { // neutral second, C - Dd
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'd'), 'q');
  } else if (step === 'm') { // 5/4-step, C - Dt
    return ScaleKeyboard.calculateStep(ScaleKeyboard.calculateStep(noteName, 'w'), 'q');
  }
};

ScaleKeyboard.calculateScale = function (noteName, steps) {
  let rows = [];
  let currentNote = noteName;
  for (let i = 0; i < 4; i++) {
    rows[i] = [{name: currentNote, freqLimit: 'low'}];
    for (let j = 0; j < steps.length - 1; j++) {
      let stepObject = steps[j];
      let step = '';
      if (typeof stepObject === 'string') {
        step = stepObject;
      } else {
        step = stepObject.step;
      }
      currentNote = ScaleKeyboard.calculateStep(currentNote, step);
      let newNoteEntry = {name: currentNote};
      if (typeof stepObject === 'object' && 'optional' in stepObject) {
        newNoteEntry.optional = stepObject.optional;
      }
      rows[i].push(newNoteEntry);
    }
    let stepObject = steps[steps.length - 1];
    let step = '';
    if (typeof stepObject === 'string') {
      step = stepObject;
    } else {
      step = stepObject.step;
    }
    currentNote = ScaleKeyboard.calculateStep(currentNote, step);
    let noteEntry = {name: currentNote, freqLimit: 'high'};
    if (i !== 3) {
      noteEntry.key = null;
    }
    rows[i].push(noteEntry);
  }
  return {rows: rows};
};

ScaleKeyboard.calculateMode = function (tonics, noteNames, scale) {
  let mode = {};
  for (let i = 0; i < tonics.length; i++) {
    mode[tonics[i]] = ScaleKeyboard.calculateScale(noteNames[i], ScaleKeyboard.scales[scale]);
  }
  return mode;
};

ScaleKeyboard.calculateScale53TET = function (noteName, steps, commas) {
  let rows = [];
  let currentNote = noteName;
  let currentFreq = getNoteFrequency(noteName);
  for (let i = 0; i < 4; i++) {
    rows[i] = [{name: currentNote, freq: currentFreq, freqLimit: 'low'}];
    for (let j = 0; j < steps.length - 1; j++) {
      let stepObject = steps[j];
      let step = '';
      if (typeof stepObject === 'string') {
        step = stepObject;
      } else {
        step = stepObject.step;
      }
      currentNote = ScaleKeyboard.calculateStep(currentNote, step);
      currentFreq *= Math.pow(2, commas[j]/53);
      let newNoteEntry = {name: currentNote, freq: currentFreq};
      if (typeof stepObject === 'object' && 'optional' in stepObject) {
        newNoteEntry.optional = stepObject.optional;
      }
      rows[i].push(newNoteEntry);
    }
    let stepObject = steps[steps.length - 1];
    let step = '';
    if (typeof stepObject === 'string') {
      step = stepObject;
    } else {
      step = stepObject.step;
    }
    currentNote = ScaleKeyboard.calculateStep(currentNote, step);
    currentFreq *= Math.pow(2, commas[steps.length - 1]/53);
    let noteEntry = {name: currentNote, freq: currentFreq, freqLimit: 'high'};
    if (i !== 3) {
      noteEntry.key = null;
    }
    rows[i].push(noteEntry);
  }
  return {rows: rows};
};

ScaleKeyboard.calculateMode53TET = function (tonics, noteNames, scale) {
  let mode = {};
  for (let i = 0; i < tonics.length; i++) {
    mode[tonics[i]] = ScaleKeyboard.calculateScale53TET(noteNames[i], ScaleKeyboard.scales[scale], ScaleKeyboard.commas[scale]);
  }
  return mode;
};

ScaleKeyboard.calculateScaleJI = function (noteName, steps, ratios) {
  let rows = [];
  let currentNote = noteName;
  let rowFreq = getNoteFrequency(noteName);
  for (let i = 0; i < 4; i++) {
    rows[i] = [{name: currentNote, freq: rowFreq, freqLimit: 'low'}];
    for (let j = 0; j < steps.length - 1; j++) {
      let stepObject = steps[j];
      let step = '';
      if (typeof stepObject === 'string') {
        step = stepObject;
      } else {
        step = stepObject.step;
      }
      currentNote = ScaleKeyboard.calculateStep(currentNote, step);
      let freq = rowFreq*ratios[j];
      let newNoteEntry = {name: currentNote, freq: freq};
      if (typeof stepObject === 'object' && 'optional' in stepObject) {
        newNoteEntry.optional = stepObject.optional;
      }
      rows[i].push(newNoteEntry);
    }
    let stepObject = steps[steps.length - 1];
    let step = '';
    if (typeof stepObject === 'string') {
      step = stepObject;
    } else {
      step = stepObject.step;
    }
    currentNote = ScaleKeyboard.calculateStep(currentNote, step);
    rowFreq *= ratios[steps.length - 1];
    let noteEntry = {name: currentNote, freq: rowFreq, freqLimit: 'high'};
    if (i !== 3) {
      noteEntry.key = null;
    }
    rows[i].push(noteEntry);
  }
  return {rows: rows};
};

ScaleKeyboard.calculateModeJI = function (tonics, noteNames, scale) {
  let mode = {};
  for (let i = 0; i < tonics.length; i++) {
    mode[tonics[i]] = ScaleKeyboard.calculateScaleJI(noteNames[i], ScaleKeyboard.scales[scale], ScaleKeyboard.ratios[scale]);
  }
  return mode;
};

ScaleKeyboard.calculateOvertones = function () {
  const C1 = 2*C0;
  let rows = [];
  for (let i = 0; i < 4; i++) {
    rows.push([]);
  }
  for (let i = 1; i <= 32; i++) {
    let row = Math.floor((i - 1)/8);
    let noteObj = {name: i, freq: i*C1};
    if (i % 2 === 1) {
      noteObj.color = 'gray';
    } else {
      noteObj.color = 'grey';
    }
    if (i % 8 === 1 && i !== 9 && i !== 17) {
      noteObj.freqLimit = 'low';
    }
    if (i % 8 === 0) {
      noteObj.freqLimit = 'high';
      if (i !== 32 && i !== 24) {
        noteObj.key = null;
        let otherNoteObj = {
          name: i,
          freq: i*C1,
          color: 'grey',
          freqLimit: 'low'
        };
        rows[row + 1].push(otherNoteObj);
      }
    }
    rows[row].push(noteObj);
  }
  return {
    'C': {
      rows: rows
    }
  };
};

ScaleKeyboard.calculate5TET = function () {
  const noteNames = ['C', 'D', 'E', 'G', 'A', 'C'];
  const startingNotes = [4*C0, 8*C0, 16*C0, 32*C0];
  let rows = [];
  for (let row = 0; row < 4; row++) {
    rows.push([]);
    for (let i = 0; i <= 5; i++) {
      let noteObj = {name: noteNames[i] + (row + 2), freq: startingNotes[row]*Math.pow(2, i/5)};
      if (i === 0) {
        noteObj.freqLimit = 'low';
      } else if (i === 5) {
        noteObj.freqLimit = 'high';
        if (row !== 3) {
          noteObj.key = null;
        }
      }
      rows[row].push(noteObj);
    }
  }
  return {
    'C': {
      rows: rows
    }
  };
};

ScaleKeyboard.scales = {
  'Major': ['w', 'w', 'd', 'w', 'w', 'w', 'd'],
  'Minor': ['w', 'd', 'w', 'w', 'd', {step: 'c', optional: true}, 'd', {step: 'c', optional: true}, 'd'],
  'Lydian': ['w', 'w', 'w', 'd', 'w', 'w', 'd'],
  'Mixolydian': ['w', 'w', 'd', 'w', 'w', 'd', 'w'],
  'Dorian': ['w', 'd', 'w', 'w', 'w', 'd', 'w'],
  'Aeolian': ['w', 'd', 'w', 'w', 'd', 'w', 'w'],
  'Phrygian': ['d', 'w', 'w', 'w', 'd', 'w', 'w'],
  'Locrian': ['d', 'w', 'w', 'd', 'w', 'w', 'w'],
  'Major Pentatonic': ['w', 'w', 'm3', 'w', 'm3'],
  'Dorian Pentatonic': ['w', 'm3', 'w', 'm3', 'w'],
  'Phrygian Pentatonic': ['m3', 'w', 'm3', 'w', 'w'],
  'Mixolydian Pentatonic': ['w', 'm3', 'w', 'w', 'm3'],
  'Minor Pentatonic': ['m3', 'w', 'w', 'm3', 'w'],
  'Blues': ['m3', 'w', 'c', 'd', 'm3', 'w'],
  'Harmonic Minor': ['w', 'd', 'w', 'w', 'd', 'a', 'd'],
  'Locrian #6': ['d', 'w', 'w', 'd', 'a', 'd', 'w'],
  'Ionian Augmented': ['w', 'w', 'd', 'a', 'd', 'w', 'd'],
  'Ukrainian Dorian': ['w', 'd', 'a', 'd', 'w', 'd', 'w'],
  'Phrygian Dominant': ['d', 'a', 'd', 'w', 'd', 'w', 'w'],
  'Lydian #2': ['a', 'd', 'w', 'd', 'w', 'w', 'd'],
  'Ultralocrian': ['d', 'w', 'd', 'w', 'w', 'd', 'a'],
  'Spanish': ['d', {step: 'c', optional: true}, {step: 'd', optional: true}, 'c', 'd', 'w', 'd', 'w', 'w'],
  'Minor-Major': ['w', 'd', 'w', 'w', 'w', 'w', 'd'],
  'Phrygian #6': ['d', 'w', 'w', 'w', 'w', 'd', 'w'],
  'Lydian Augmented': ['w', 'w', 'w', 'w', 'd', 'w', 'd'],
  'Acoustic': ['w', 'w', 'w', 'd', 'w', 'd', 'w'],
  'Mixolydian b6': ['w', 'w', 'd', 'w', 'd', 'w', 'w'],
  'Half-Diminished': ['w', 'd', 'w', 'd', 'w', 'w', 'w'],
  'Altered': ['d', 'w', 'd', 'w', 'w', 'w', 'w'],
  'Chromatic': ['c', 'd', 'c', 'd', 'd', 'c', 'd', 'c', 'd', 'c', 'd', 'd'],
  'Whole Tone': ['w', 'w', 'w', 'd3', 'w', 'w'],
  'Half-Whole Diminished': ['d', 'w', 'c', 'w', 'd', 'w', 'd', 'w'],
  'Whole-Half Diminished': ['w', 'd', 'w', 'd', 'w', 'c', 'w', 'd'],
  'Augmented Mode I': ['m3', 'c', 'm3', 'd', 'a', 'd'],
  'Augmented Mode II': ['d', 'a', 'd', 'a', 'd', 'm3'],
  'Enneatonic Mode I': ['w', 'd', 'c', 'w', 'd', 'd', 'w', 'c', 'd'],
  'Enneatonic Mode II': ['d', 'w', 'c', 'd', 'w', 'd', 'c', 'w', 'd'],
  'Enneatonic Mode III': ['d', 'c', 'w', 'd', 'd', 'w', 'c', 'd', 'w'],
  '24-TET': ['q', 'q', 't', 'q', 'q', 't', 'q', 'q', 'q', 't', 'q', 'q', 't', 'q', 'q', 't', 'q', 'q', 'q', 't', 'q', 'q', 'q', 't'],
  'Rast': ['w', 'n', 'n', 'w', 'w', 'n', 'n'],
  'Rast (both forms)': ['w', 'n', 'n', 'w', 'w', {step: 'd', optional: true}, 'q', 'n'],
  'Mahur': ['w', 'n', 'n', 'w', 'w', {step: 'd', optional: true}, 'c', 'd'],
  'Suznak': ['w', 'n', 'n', 'w', 'd', 'a', 'd'],
  'Nayruz': ['w', 'n', 'n', 'w', 'n', 'n', 'w'],
  'Dalanshin': [{step: 'd', optional: true}, 'c', 'n', 'n', 'w', 'w', 'n', 'n'],
  'Ajam': ['w', 'w', 'd', 'w', 'w', 'w', 'd'],
  'Jiharkah': ['w', 'w', 'd', 'w', 'w', {step: 'd', optional: true}, 'q', 'n'],
  'Shawk-Afza': ['w', 'w', 'd', 'w', 'd', 'a', 'd'],
  'Suzdalara': ['w', {step: 'n', optional: true}, 'q', 'd', 'w', 'w', 'd', 'w'],
  'Nahwand': ['w', 'd', 'w', 'w', {step: 'd', optional: true}, 'u', {step: 'w', optional: true}, 'c', 'd'],
  'Nahwand (alternate)': ['w', 'd', 'w', 'w', {step: 'd', optional: true}, 'c', {step: 'd', optional: true}, 'c', 'd'],
  'Ushaq Misri': ['w', 'd', 'w', 'w', {step: 'd', optional: true}, 'q', 'n', 'w'],
  'Busalik': ['w', 'd', 'w', 'w', {step: 'd', optional: true}, 'u', {step: 'w', optional: true}, 'c', 'd'],
  'Sultani Yakah': ['w', 'd', 'w', 'w', 'd', 'a', 'd'],
  'Nahwand Murassa': ['w', 'd', 'w', 'd', {step: 'c', optional: true}, {step: 'd', optional: true}, 'c', 'd', {step: 'c', optional: true}, 'd'],
  'Nahwand Kabir': ['w', 'd', 'w', 'w', 'w', 'd', 'w'],
  'Kurd': ['d', 'w', 'w', 'w', 'd', 'w', 'w'],
  'Hijaz Kar Kurd (24-TET)': ['d', {step: 'w', optional: true}, 'c', 'd', 'w', 'd', {step: 'w', optional: true}, 'c', 'd'],
  'Hijaz Kar Kurd (53-TET)': [{step: 'd', optional: true}, 'u', {step: 'w', optional: true}, 'c', 'd', 'w', {step: 'd', optional: true}, 'u', {step: 'w', optional: true}, 'c', 'd'],
  'Lami': ['d', 'w', 'w', 'd', 'w', 'w', 'w'],
  'Tarz Nawin': ['d', 'w', 'w', 'd', 'a', 'd', 'w'],
  'Hijaz': ['d', 'a', 'd', 'w', {step: 'd', optional: true}, 'q', 'n', 'w'],
  'Zanjaran': ['d', 'a', 'd', 'w', 'w', 'd', 'w'],
  'Shadd Araban (24-TET)': ['d', 'a', 'd', 'w', 'd', {step: 'w', optional: true}, 'c', 'd'],
  'Shadd Araban (53-TET)': ['d', 'a', 'd', 'w', {step: 'd', optional: true}, 'u', {step: 'w', optional: true}, 'c', 'd'],
  'Shehnaz': ['d', {step: 'c', optional: true}, {step: 'd', optional: true}, 'c', 'd', 'w', 'd', {step: 'c', optional: true}, {step: 'd', optional: true}, 'c', 'd'],
  'Sikah Baladi': ['n', 'w', 'n', 'w', 'n', 'w', 'n'],
  'Sikah Baladi X': ['n', 'w', 'n', 'w', 'n', 'w', 'n'],
  'Nawa Athar': ['w', 'd', 'a', 'd', 'd', 'a', 'd'],
  'Nikriz': ['w', 'd', 'a', 'd', 'w', 'd', 'w'],
  'Athar Kurd': ['d', 'w', 'a', 'd', 'd', 'a', 'd'],
  'Bayat': ['n', 'n', 'w', 'w', 'd', 'w', 'w'],
  'Mehayar': ['n', 'n', 'w', 'w', {step: 'd', optional: true}, 'q', 'n', 'w'],
  'Hoseni': ['n', 'n', 'w', 'w', {step: 'd', optional: true}, 'q', 'n', 'w'],
  'Shuri': ['n', 'n', 'w', 'd', 'a', 'd', 'w'],
  'Ashiran': ['n', 'n', 'w', 'n', 'n', 'w', 'w'],
  'Nahoft': ['n', 'n', 'w', {step: 'n', optional: true}, 'q', {step: 'd', optional: true}, 'c', 'd', 'w'],
  'Isfahan': ['n', {step: 'q', optional: true}, 'd', {step: 'q', optional: true}, 'n', 'w', 'd', 'w', 'w'],
  'Arazbar': ['n', 'n', 'w', 'n', 'n', 'w', 'w'],
  'Rahaw (24-TET)': ['n', 'n', 'w', 'w', 'd', {step: 'q', optional: true}, 'n', 'w'],
  'Rahaw (53-TET)': ['n', 'n', 'w', 'w', {step: 'u', optional: true}, 'd', {step: 'q', optional: true}, 'n', 'w'],
  'Siga': ['n', 'w', 'w', {step: 'd', optional: true}, 'q', 'n', 'w', {step: 'c', optional: true}, 't'],
  'Huzam': ['n', 'w', 'd', 'a', 'd', 'w', {step: 'c', optional: true}, 't'],
  'Iraq': ['n', 'w', 'n', 'n', 'w', 'w', 'n'],
  'Bastanikar': ['n', 'w', 'n', 'n', 'd', 'a', 'd', 'q'],
  'Mustaar': [{step: 'n', optional: true}, 'c', 'd', 'w', 'd', 'w', 'w', 'n'],
  'Awj Ara': ['n', {step: 'c', optional: true}, {step: 'd', optional: true}, 'c', 't', 'm', 'd', 'a', 't'],
  'Saba': [{step: 'd', optional: true}, 'q', {step: 'q', optional: true}, 'd', 'd', 'a', 'd', 'w', 'd', 'c'],
  'Tarz Jadid': ['w', 'w', 'd', 'a', 'd', 'w', 'd'],
  'Neapolitan Minor': ['d', 'w', 'w', 'w', 'd', 'a', 'd'],
  'Neapolitan Major': ['d', 'w', 'w', 'w', 'w', 'w', 'd'],
  'Oriental': ['d', 'a', 'd', 'd', 'a', 'd', 'w'],
  'Double Harmonic': ['d', 'a', 'd', 'w', 'd', 'a', 'd'],
  'Hungarian Minor': ['w', 'd', 'a', 'd', 'd', 'a', 'd'],
  'Major Locrian': ['w', 'w', 'd', 'd', 'w', 'w', 'w'],
  'Lydian Minor': ['w', 'w', 'w', 'd', 'd', 'w', 'w'],
  'Leading Whole Tone': ['w', 'w', 'w', 'w', 'w', 'd', 'd'],
  'Hungarian Major': ['a', 'd', 'w', 'd', 'w', 'd', 'w'],
  'Harmonic Major': ['w', 'w', 'd', 'w', 'd', 'a', 'd'],
  'Enigmatic': ['d', 'a', {step: 'd', optional: true}, 'c', 'w', 'w', 'd', 'd'],
  'Prometheus': ['w', 'w', 'w', 'm3', 'd', 'w'],
  'Prometheus Neapolitan': ['d', 'a', 'w', 'm3', 'd', 'w'],
  'Balinese': ['d', 'w', 'M3', 'd', 'M3'],
  'Hirajoshi': ['w', 'd', 'M3', 'd', 'M3'],
  'Kumoi': ['w', 'd', 'M3', 'w', 'm3'],
  'Phrygian #6 Pentatonic': ['d', 'w', 'M3', 'w', 'm3'],
  'Gregorian': ['w', 'w', 'd', 'w', 'w', {step: 'd', optional: true}, 'c', 'd']
};

ScaleKeyboard.commas = {
  'Rast': [9, 7, 6, 9, 9, 7, 6],
  'Rast (both forms)': [9, 7, 6, 9, 9, 4, 3, 6],
  'Mahur': [9, 7, 6, 9, 9, 4, 4, 5],
  'Suznak': [9, 7, 6, 9, 5, 12, 5],
  'Nayruz': [9, 7, 6, 9, 7, 6, 9],
  'Dalanshin': [5, 4, 7, 6, 9, 9, 7, 6],
  'Ajam': [9, 8, 5, 9, 9, 8, 5],
  'Jiharkah': [9, 8, 5, 9, 9, 4, 3, 6],
  'Shawk-Afza': [9, 8, 5, 9, 5, 12, 5],
  'Suzdalara': [9, 7, 1, 5, 9, 8, 5, 9],
  'Nahwand': [9, 4, 9, 9, 4, 1, 8, 4, 5],
  'Nahwand (alternate)': [9, 4, 9, 9, 4, 5, 4, 4, 5],
  'Ushaq Misri': [8, 4, 10, 9, 4, 2, 7, 9],
  'Busalik': [8, 4, 10, 9, 4, 1, 8, 4, 5],
  'Sultani Yakah': [9, 4, 9, 9, 5, 12, 5],
  'Nahwand Murassa': [9, 4, 9, 5, 4, 5, 3, 5, 4, 5],
  'Nahwand Kabir': [9, 4, 9, 9, 9, 4, 9],
  'Kurd': [4, 9, 9, 9, 4, 9, 9],
  'Hijaz Kar Kurd (53-TET)': [4, 1, 8, 4, 5, 9, 4, 1, 8, 4, 5],
  'Lami': [4, 9, 9, 4, 9, 9, 9],
  'Tarz Nawin': [4, 9, 9, 5, 12, 5, 9],
  'Hijaz': [5, 12, 5, 9, 4, 3, 6, 9],
  'Zanjaran': [5, 12, 5, 9, 8, 5, 9],
  'Shadd Araban (53-TET)': [5, 12, 5, 9, 4, 1, 8, 4, 5],
  'Shehnaz': [5, 4, 4, 4, 5, 9, 5, 4, 4, 4, 5],
  'Sikah Baladi': [6, 10, 6, 9, 6, 10, 6],
  'Sikah Baladi X': [7, 8, 7, 9, 7, 8, 7],
  'Nawa Athar': [9, 5, 12, 5, 5, 12, 5],
  'Nikriz': [9, 5, 12, 5, 9, 4, 9],
  'Athar Kurd': [4, 9, 13, 5, 5, 12, 5],
  'Bayat': [6, 7, 9, 9, 4, 9, 9],
  'Mehayar': [6, 7, 9, 9, 4, 3, 6, 9],
  'Hoseni': [6, 7, 9, 9, 4, 2, 7, 9],
  'Shuri': [6, 7, 9, 5, 12, 5, 9],
  'Ashiran': [6, 7, 9, 6, 7, 9, 9],
  'Nahoft': [6, 7, 9, 6, 3, 4, 4, 5, 9],
  'Isfahan': [6, 3, 4, 3, 6, 9, 4, 9, 9],
  'Arazbar': [6, 7, 9, 7, 6, 9, 9],
  'Rahaw (53-TET)': [6, 7, 9, 8, 1, 4, 3, 6, 9],
  'Siga': [6, 9, 9, 4, 3, 6, 9, 4, 3],
  'Huzam': [6, 9, 5, 12, 5, 9, 4, 3],
  'Iraq': [6, 9, 6, 7, 9, 9, 7],
  'Bastanikar': [6, 9, 6, 7, 5, 12, 5, 3],
  'Mustaar': [6, 4, 5, 9, 4, 9, 9, 7],
  'Awj Ara': [6, 4, 5, 4, 3, 10, 5, 13, 3],
  'Saba': [4, 2, 3, 4, 5, 12, 5, 9, 4, 5],
  'Tarz Jadid': [9, 8, 5, 12, 5, 9, 5],
  'Gregorian': [9, 9, 4, 9, 9, 4, 5, 4]
};

ScaleKeyboard.ratios = {
  'Gregorian': [9/8, 81/64, 4/3, 3/2, 27/16, 16/9, 243/128, 2]
};

ScaleKeyboard.scaleDegrees = {
  'Major': {
    text: '1 2 3 4 5 6 7'
  },
  'Minor': {
    text: '1 2 b3 4 5 b6 (6) b7 (7)'
  },
  'Lydian': {
    text: '1 2 3 #4 5 6 7'
  },
  'Mixolydian': {
    text: '1 2 3 4 5 6 b7'
  },
  'Dorian': {
    text: '1 2 b3 4 5 6 b7'
  },
  'Aeolian': {
    text: '1 2 b3 4 5 b6 b7'
  },
  'Phrygian': {
    text: '1 b2 b3 4 5 b6 b7'
  },
  'Locrian': {
    text: '1 b2 b3 4 b5 b6 b7'
  },
  'Major Pentatonic': {
    text: '1 2 3 5 6'
  },
  'Dorian Pentatonic': {
    text: '1 2 4 5 b7'
  },
  'Phrygian Pentatonic': {
    text: '1 b3 4 b6 b7'
  },
  'Mixolydian Pentatonic': {
    text: '1 2 4 5 6'
  },
  'Minor Pentatonic': {
    text: '1 b3 4 5 b7'
  },
  'Blues': {
    text: '1 b3 4 #4 5 b7'
  },
  'Overtone': {
    text: ''
  },
  '5-TET': {
    text: ''
  },
  'Harmonic Minor': {
    text: '1 2 b3 4 5 b6 7'
  },
  'Locrian #6': {
    text: '1 b2 b3 4 b5 6 b7'
  },
  'Ionian Augmented': {
    text: '1 2 3 4 #5 6 7'
  },
  'Ukrainian Dorian': {
    text: '1 2 b3 #4 5 6 b7'
  },
  'Phrygian Dominant': {
    text: '1 b2 3 4 5 b6 b7'
  },
  'Lydian #2': {
    text: '1 #2 3 #4 5 6 7'
  },
  'Ultralocrian': {
    text: '1 b2 b3 b4 b5 b6 bb7'
  },
  'Spanish': {
    text: '1 b2 (2) (b3) 3 4 5 b6 b7'
  },
  'Minor-Major': {
    text: '1 2 b3 4 5 6 7'
  },
  'Phrygian #6': {
    text: '1 b2 b3 4 5 6 b7'
  },
  'Lydian Augmented': {
    text: '1 2 3 #4 #5 6 7'
  },
  'Acoustic': {
    text: '1 2 3 #4 5 6 b7'
  },
  'Mixolydian b6': {
    text: '1 2 3 4 5 b6 b7'
  },
  'Half-Diminished': {
    text: '1 2 b3 4 b5 b6 b7'
  },
  'Altered': {
    text: '1 b2 b3 b4 b5 b6 b7'
  },
  'Chromatic': {
    text: '1 #1 2 #2 3 4 #4 5 #5 6 #6 7'
  },
  'Whole Tone': {
    text: '1 2 3 #4 b6 b7'
  },
  'Half-Whole Diminished': {
    text: '1 b2 b3 3 #4 5 6 b7'
  },
  'Whole-Half Diminished': {
    text: '1 2 b3 4 b5 b6 6 b7'
  },
  'Augmented Mode I': {
    text: '1 b3 3 5 b6 7'
  },
  'Augmented Mode II': {
    text: '1 b2 3 4 #5 6'
  },
  'Enneatonic Mode I': {
    text: '1 2 b3 3 #4 5 b6 b7 7'
  },
  'Enneatonic Mode II': {
    text: '1 b2 b3 3 4 5 b6 6 7'
  },
  'Enneatonic Mode III': {
    text: '1 b2 2 3 4 b5 b6 6 b7'
  },
  '24-TET': {
    text: ''
  },
  'Rast (24-TET)': {
    text: '1 2 d3 4 5 6 d7'
  },
  'Rast (53-TET)': {
    text: '1 2 d3 4 5 6 d7'
  },
  'Rast (both forms) (24-TET)': {
    text: '1 2 d3 4 5 6 (b7) d7'
  },
  'Rast (both forms) (53-TET)': {
    text: '1 2 d3 4 5 6 (b7) d7'
  },
  'Mahur (24-TET)': {
    text: '1 2 d3 4 5 6 (b7) 7'
  },
  'Mahur (53-TET)': {
    text: '1 2 d3 4 5 6 (b7) 7'
  },
  'Suznak (24-TET)': {
    text: '1 2 d3 4 5 b6 7'
  },
  'Suznak (53-TET)': {
    text: '1 2 d3 4 5 b6 7'
  },
  'Nayruz (24-TET)': {
    text: '1 2 d3 4 5 d6 b7'
  },
  'Nayruz (53-TET)': {
    text: '1 2 d3 4 5 d6 b7'
  },
  'Dalanshin (24-TET)': {
    text: '1 (b2) 2 d3 4 5 6 d7'
  },
  'Dalanshin (53-TET)': {
    text: '1 (b2) 2 d3 4 5 6 d7'
  },
  'Ajam (53-TET)': {
    text: '1 2 3 4 5 6 7'
  },
  'Jiharkah (24-TET)': {
    text: '1 2 3 4 5 6 (b7) d7'
  },
  'Jiharkah (53-TET)': {
    text: '1 2 3 4 5 6 (b7) d7'
  },
  'Shawk-Afza (24-TET)': {
    text: '1 2 3 4 5 b6 7'
  },
  'Shawk-Afza (53-TET)': {
    text: '1 2 3 4 5 b6 7'
  },
  'Suzdalara (24-TET)': {
    text: '1 2 (d3) 3 4 5 6 b7'
  },
  'Suzdalara (53-TET)': {
    text: '1 2 (d3) 3 4 5 6 b7'
  },
  'Nahwand (53-TET)': {
    text: '1 2 b3 4 5 (b6) b6 (b7) 7'
  },
  'Nahwand (alternate) (53-TET)': {
    text: '1 2 b3 4 5 (b6) 6 (b7) 7'
  },
  'Ushaq Misri (24-TET)': {
    text: '1 2 b3 4 5 (b6) d6 b7'
  },
  'Ushaq Misri (53-TET)': {
    text: '1 2 b3 4 5 (b6) d6 b7'
  },
  'Busalik (53-TET)': {
    text: '1 2 b3 4 5 (b6) b6 (b7) 7'
  },
  'Sultani Yakah (53-TET)': {
    text: '1 2 b3 4 5 b6 7'
  },
  'Nahwand Murassa (24-TET)': {
    text: '1 2 b3 4 b5 (5) (b6) 6 b7 (7)'
  },
  'Nahwand Murassa (53-TET)': {
    text: '1 2 b3 4 b5 (5) (b6) 6 b7 (7)'
  },
  'Nahwand Kabir (53-TET)': {
    text: '1 2 b3 4 5 6 b7'
  },
  'Kurd (53-TET)': {
    text: '1 b2 b3 4 5 b6 b7'
  },
  'Hijaz Kar Kurd (24-TET)': {
    text: '1 b2 (b3) 3 4 5 b6 (b7) 7'
  },
  'Hijaz Kar Kurd (53-TET)': {
    text: '1 b2 (b3) 3 4 5 b6 (b7) 7'
  },
  'Lami (53-TET)': {
    text: '1 b2 b3 4 b5 b6 b7'
  },
  'Tarz Nawin (53-TET)': {
    text: '1 b2 b3 4 b5 6 b7'
  },
  'Hijaz (24-TET)': {
    text: '1 b2 3 4 5 (b6) d6 b7'
  },
  'Hijaz (53-TET)': {
    text: '1 b2 3 4 5 (b6) d6 b7'
  },
  'Zanjaran (24-TET)': {
    text: '1 b2 3 4 5 6 b7'
  },
  'Zanjaran (53-TET)': {
    text: '1 b2 3 4 5 6 b7'
  },
  'Shadd Araban (24-TET)': {
    text: '1 b2 3 4 5 b6 (b7) 7'
  },
  'Shadd Araban (53-TET)': {
    text: '1 b2 3 4 5 (b6) b6 (b7) 7'
  },
  'Shehnaz (24-TET)': {
    text: '1 b2 (2 b3) 3 4 5 b6 (6 b7) 7'
  },
  'Shehnaz (53-TET)': {
    text: '1 b2 (2 b3) 3 4 5 b6 (6 b7) 7'
  },
  'Sikah Baladi (24-TET)': {
    text: '1 d2 d3 4 5 d6 d7'
  },
  'Sikah Baladi (53-TET)': {
    text: '1 d2 d3 4 5 d6 d7'
  },
  'Sikah Baladi X (53-TET)': {
    text: '1 d2 d3 4 5 d6 d7'
  },
  'Nawa Athar (12-TET)': {
    text: '1 2 b3 #4 5 b6 7'
  },
  'Nawa Athar (53-TET)': {
    text: '1 2 b3 #4 5 b6 7'
  },
  'Nikriz (53-TET)': {
    text: '1 2 b3 #4 5 6 b7'
  },
  'Athar Kurd (12-TET)': {
    text: '1 b2 b3 #4 5 b6 7'
  },
  'Athar Kurd (53-TET)': {
    text: '1 b2 b3 #4 5 b6 7'
  },
  'Bayat (24-TET)': {
    text: '1 d2 b3 4 5 b6 b7'
  },
  'Bayat (53-TET)': {
    text: '1 d2 b3 4 5 b6 b7'
  },
  'Mehayar (24-TET)': {
    text: '1 d2 b3 4 5 (b6) d6 b7'
  },
  'Mehayar (53-TET)': {
    text: '1 d2 b3 4 5 (b6) d6 b7'
  },
  'Hoseni (24-TET)': {
    text: '1 d2 b3 4 5 (b6) d6 b7'
  },
  'Hoseni (53-TET)': {
    text: '1 d2 b3 4 5 (b6) d6 b7'
  },
  'Shuri (24-TET)': {
    text: '1 d2 b3 4 b5 6 b7'
  },
  'Shuri (53-TET)': {
    text: '1 d2 b3 4 b5 6 b7'
  },
  'Ashiran (24-TET)': {
    text: '1 d2 b3 4 d5 b6 b7'
  },
  'Ashiran (53-TET)': {
    text: '1 d2 b3 4 d5 b6 b7'
  },
  'Nahoft (24-TET)': {
    text: '1 d3 b3 4 (d5) 5 (b6) 6 b7'
  },
  'Nahoft (53-TET)': {
    text: '1 d3 b3 4 (d5) 5 (b6) 6 b7'
  },
  'Isfahan (24-TET)': {
    text: '1 d2 (2) b3 (d3) 4 5 b6 b7'
  },
  'Isfahan (53-TET)': {
    text: '1 d2 (2) b3 (d3) 4 5 b6 b7'
  },
  'Arazbar (24-TET)': {
    text: '1 d2 b3 4 d5 b6 b7'
  },
  'Arazbar (53-TET)': {
    text: '1 d2 b3 4 d5 b6 b7'
  },
  'Rahaw (24-TET)': {
    text: '1 d2 b3 4 5 b6 (d6) b7'
  },
  'Rahaw (53-TET)': {
    text: '1 d2 b3 4 5 (5) b6 (d6) b7'
  },
  'Siga (24-TET)': {
    text: '1 d2 d3 t4 (d5) 5 d6 d7 (t7)'
  },
  'Siga (53-TET)': {
    text: '1 d2 d3 t4 (d5) 5 d6 d7 (t7)'
  },
  'Huzam (24-TET)': {
    text: '1 d2 d3 d4 t5 d6 d7 (t7)'
  },
  'Huzam (53-TET)': {
    text: '1 d2 d3 d4 t5 d6 d7 (t7)'
  },
  'Iraq (24-TET)': {
    text: '1 d2 d3 4 d5 d6 d7'
  },
  'Iraq (53-TET)': {
    text: '1 d2 d3 4 d5 d6 d7'
  },
  'Bastanikar (24-TET)': {
    text: '1 d2 d3 4 d5 db6 d7 d1'
  },
  'Bastanikar (53-TET)': {
    text: '1 d2 d3 4 d5 db6 d7 d1'
  },
  'Mustaar (24-TET)': {
    text: '1 (d2) t2 d3 t4 d5 d6 d7'
  },
  'Mustaar (53-TET)': {
    text: '1 (d2) t2 d3 t4 d5 d6 d7'
  },
  'Awj Ara (24-TET)': {
    text: '1 d2 (t2) (d3) t3 4 t5 d6 t7'
  },
  'Awj Ara (53-TET)': {
    text: '1 d2 (t2) (d3) t3 4 t5 d6 t7'
  },
  'Saba (24-TET)': {
    text: '1 (b2) d2 (2) b3 b4 5 b6 b7 b1'
  },
  'Saba (53-TET)': {
    text: '1 (b2) d2 (2) b3 b4 5 b6 b7 b1'
  },
  'Tarz Jadid (53-TET)': {
    text: '1 2 3 4 #5 6 7'
  },
  'Neapolitan Minor': {
    text: '1 b2 b3 4 5 b6 7'
  },
  'Neapolitan Major': {
    text: '1 b2 b3 4 5 6 7'
  },
  'Oriental': {
    text: '1 b2 3 4 b5 6 b7'
  },
  'Double Harmonic': {
    text: '1 b2 3 4 5 b6 7'
  },
  'Hungarian Minor': {
    text: '1 2 b3 #4 5 b6 7'
  },
  'Major Locrian': {
    text: '1 2 3 4 b5 b6 b7'
  },
  'Lydian Minor': {
    text: '1 2 3 #4 5 b6 b7'
  },
  'Leading Whole Tone': {
    text: '1 2 3 #4 #5 #6 7'
  },
  'Hungarian Major': {
    text: '1 #2 3 #4 5 6 b7'
  },
  'Harmonic Major': {
    text: '1 2 3 4 5 b6 7'
  },
  'Enigmatic': {
    text: '1 b2 3 (4) #4 #5 #6 7'
  },
  'Prometheus': {
    text: '1 2 3 #4 6 b7'
  },
  'Prometheus Neapolitan': {
    text: '1 b2 3 #4 6 b7'
  },
  'Balinese': {
    text: '1 b2 b3 5 b6'
  },
  'Hirajoshi': {
    text: '1 2 b3 5 b6'
  },
  'Kumoi': {
    text: '1 2 b3 5 6'
  },
  'Phrygian #6 Pentatonic': {
    text: '1 b2 b3 5 6'
  },
  'Gregorian (12-TET)': {
    text: '1 2 3 4 5 6 (b7) 7'
  },
  'Gregorian (53-TET)': {
    text: '1 2 3 4 5 6 (b7) 7'
  },
  'Gregorian (Pythagorean)': {
    text: '1 2 3 4 5 6 (b7) 7'
  }
};

ScaleKeyboard.majorTonics = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
ScaleKeyboard.majorNoteNames = ['C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'F#2', 'G1', 'Ab1', 'A1', 'Bb1', 'B1'];
ScaleKeyboard.minorTonics = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
ScaleKeyboard.minorNoteNames = ['C2', 'C#2', 'D2', 'Eb2', 'E2', 'F2', 'F#2', 'G1', 'G#1', 'A1', 'Bb1', 'B1'];
ScaleKeyboard.sigaTonics = ['Ed', 'Fd', 'Ft', 'Gd', 'Gt', 'Ad', 'At', 'Bd', 'Cd', 'Ct', 'Dd', 'Dt'];
ScaleKeyboard.sigaNoteNames = ['Ed2', 'Fd2', 'Ft2', 'Gd1', 'Gt1', 'Ad1', 'At1', 'Bd1', 'Cd2', 'Ct2', 'Dd2', 'Dt2'];

ScaleKeyboard.modes = {
  'Major': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Major'),
  'Minor': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Minor'),
  'Lydian': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Lydian'),
  'Mixolydian': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Mixolydian'),
  'Dorian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Dorian'),
  'Aeolian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Aeolian'),
  'Phrygian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Phrygian'),
  'Locrian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Locrian'),
  'Major Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Major Pentatonic'),
  'Dorian Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Dorian Pentatonic'),
  'Phrygian Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Phrygian Pentatonic'),
  'Mixolydian Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Mixolydian Pentatonic'),
  'Minor Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Minor Pentatonic'),
  'Blues': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Blues'),
  'Overtone': ScaleKeyboard.calculateOvertones(),
  '5-TET': ScaleKeyboard.calculate5TET(),
  'Harmonic Minor': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Harmonic Minor'),
  'Locrian #6': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Locrian #6'),
  'Ionian Augmented': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Ionian Augmented'),
  'Ukrainian Dorian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ukrainian Dorian'),
  'Phrygian Dominant': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Phrygian Dominant'),
  'Lydian #2': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Lydian #2'),
  'Ultralocrian': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ultralocrian'),
  'Spanish': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Spanish'),
  'Minor-Major': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Minor-Major'),
  'Phrygian #6': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Phrygian #6'),
  'Lydian Augmented': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Lydian Augmented'),
  'Acoustic': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Acoustic'),
  'Mixolydian b6': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Mixolydian b6'),
  'Half-Diminished': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Half-Diminished'),
  'Altered': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Altered'),
  'Chromatic': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Chromatic'),
  'Whole Tone': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Whole Tone'),
  'Half-Whole Diminished': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Half-Whole Diminished'),
  'Whole-Half Diminished': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Whole-Half Diminished'),
  'Augmented Mode I': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Augmented Mode I'),
  'Augmented Mode II': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Augmented Mode II'),
  'Enneatonic Mode I': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Enneatonic Mode I'),
  'Enneatonic Mode II': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Enneatonic Mode II'),
  'Enneatonic Mode III': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Enneatonic Mode III'),
  '24-TET': Object.assign(ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, '24-TET'), {tight: true}),
  'Rast (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Rast'),
  'Rast (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Rast'),
  'Rast (both forms) (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Rast (both forms)'),
  'Rast (both forms) (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Rast (both forms)'),
  'Mahur (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Mahur'),
  'Mahur (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Mahur'),
  'Suznak (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Suznak'),
  'Suznak (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Suznak'),
  'Nayruz (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Nayruz'),
  'Nayruz (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Nayruz'),
  'Dalanshin (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Dalanshin'),
  'Dalanshin (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Dalanshin'),
  'Ajam (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Ajam'),
  'Jiharkah (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Jiharkah'),
  'Jiharkah (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Jiharkah'),
  'Shawk-Afza (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Shawk-Afza'),
  'Shawk-Afza (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Shawk-Afza'),
  'Suzdalara (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Suzdalara'),
  'Suzdalara (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Suzdalara'),
  'Nahwand (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahwand'),
  'Nahwand (alternate) (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahwand (alternate)'),
  'Ushaq Misri (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ushaq Misri'),
  'Ushaq Misri (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ushaq Misri'),
  'Busalik (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Busalik'),
  'Sultani Yakah (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Sultani Yakah'),
  'Nahwand Murassa (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahwand Murassa'),
  'Nahwand Murassa (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahwand Murassa'),
  'Nahwand Kabir (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahwand Kabir'),
  'Kurd (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Kurd'),
  'Hijaz Kar Kurd (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hijaz Kar Kurd (24-TET)'),
  'Hijaz Kar Kurd (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hijaz Kar Kurd (53-TET)'),
  'Lami (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Lami'),
  'Tarz Nawin (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Tarz Nawin'),
  'Hijaz (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hijaz'),
  'Hijaz (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hijaz'),
  'Zanjaran (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Zanjaran'),
  'Zanjaran (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Zanjaran'),
  'Shadd Araban (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shadd Araban (24-TET)'),
  'Shadd Araban (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shadd Araban (53-TET)'),
  'Shehnaz (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shehnaz'),
  'Shehnaz (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shehnaz'),
  'Sikah Baladi (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Sikah Baladi'),
  'Sikah Baladi (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Sikah Baladi'),
  'Sikah Baladi X (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Sikah Baladi X'),
  'Nawa Athar (12-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nawa Athar'),
  'Nawa Athar (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nawa Athar'),
  'Nikriz (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nikriz'),
  'Athar Kurd (12-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Athar Kurd'),
  'Athar Kurd (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Athar Kurd'),
  'Bayat (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Bayat'),
  'Bayat (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Bayat'),
  'Mehayar (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Mehayar'),
  'Mehayar (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Mehayar'),
  'Hoseni (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hoseni'),
  'Hoseni (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hoseni'),
  'Shuri (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shuri'),
  'Shuri (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Shuri'),
  'Ashiran (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ashiran'),
  'Ashiran (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Ashiran'),
  'Nahoft (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahoft'),
  'Nahoft (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Nahoft'),
  'Isfahan (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Isfahan'),
  'Isfahan (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Isfahan'),
  'Arazbar (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Arazbar'),
  'Arazbar (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Arazbar'),
  'Rahaw (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Rahaw (24-TET)'),
  'Rahaw (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Rahaw (53-TET)'),
  'Siga (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Siga'),
  'Siga (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Siga'),
  'Huzam (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Huzam'),
  'Huzam (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Huzam'),
  'Iraq (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Iraq'),
  'Iraq (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Iraq'),
  'Bastanikar (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Bastanikar'),
  'Bastanikar (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Bastanikar'),
  'Mustaar (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Mustaar'),
  'Mustaar (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Mustaar'),
  'Awj Ara (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Awj Ara'),
  'Awj Ara (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.sigaTonics, ScaleKeyboard.sigaNoteNames, 'Awj Ara'),
  'Saba (24-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Saba'),
  'Saba (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Saba'),
  'Tarz Jadid (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Tarz Jadid'),
  'Neapolitan Minor': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Neapolitan Minor'),
  'Neapolitan Major': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Neapolitan Major'),
  'Oriental': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Oriental'),
  'Double Harmonic': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Double Harmonic'),
  'Hungarian Minor': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hungarian Minor'),
  'Major Locrian': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Major Locrian'),
  'Lydian Minor': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Lydian Minor'),
  'Leading Whole Tone': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Leading Whole Tone'),
  'Hungarian Major': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Hungarian Major'),
  'Harmonic Major': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Harmonic Major'),
  'Enigmatic': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Enigmatic'),
  'Prometheus': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Prometheus'),
  'Prometheus Neapolitan': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Prometheus Neapolitan'),
  'Balinese': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Balinese'),
  'Hirajoshi': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Hirajoshi'),
  'Kumoi': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Kumoi'),
  'Phrygian #6 Pentatonic': ScaleKeyboard.calculateMode(ScaleKeyboard.minorTonics, ScaleKeyboard.minorNoteNames, 'Phrygian #6 Pentatonic'),
  'Gregorian (12-TET)': ScaleKeyboard.calculateMode(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Gregorian'),
  'Gregorian (53-TET)': ScaleKeyboard.calculateMode53TET(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Gregorian'),
  'Gregorian (Pythagorean)': ScaleKeyboard.calculateModeJI(ScaleKeyboard.majorTonics, ScaleKeyboard.majorNoteNames, 'Gregorian')
};