// hemiola should be in an empty div
function Hemiola(div) {
  this.isPlaying = false;
  this.playable = false; // generate gets run but doesn't get added to any samples
  this.tempo = null;
  this.numerator = null;
  this.denominator = null;
  this.ratio = null;
  this.div = div;
  this.input = null;
  this.button = null;
  this.numeratorInput = null;
  this.denominatorInput = null;
  this.setupHtml();
  this.setupEvents();
  this.audioPlayer = new AudioPlayer();
  initNotes12TET(); // we need C7
  this.audioPlayer.globalAudioPlayer = false;

  this.clickFrame = 0;
  this.clickFrameTarget = 0;

  this.noteFrame = 0;
  this.noteFrameTarget = 0;
}

Hemiola.prototype.setupHtml = function () {
  let span = document.createElement('span');
  span.innerHTML = 'Enter metronome tempo:';
  this.div.appendChild(span);

  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.size = 5;
  this.input.id = this.div.id + 'Input';
  this.input.className = 'hemiola-input';
  this.div.appendChild(this.input);

  this.button = document.createElement('button');
  this.button.innerHTML = 'Start'; // it will become 'Stop' when the metronome is on
  this.button.type = 'button';
  this.button.disabled = true;
  this.div.appendChild(this.button);

  let br = document.createElement('br');
  this.div.appendChild(br);

  let ratioSpan = document.createElement('span');
  ratioSpan.innerHTML = 'Enter ratio:';
  this.div.appendChild(ratioSpan);

  this.numeratorInput = document.createElement('input');
  this.numeratorInput.type = 'text';
  this.numeratorInput.size = 4;
  this.numeratorInput.id = this.div.id + 'Num';
  this.numeratorInput.className = 'hemiola-input-numerator';
  this.div.appendChild(this.numeratorInput);

  let barSpan = document.createElement('span');
  barSpan.innerHTML = '/';
  this.div.appendChild(barSpan);

  this.denominatorInput = document.createElement('input');
  this.denominatorInput.type = 'text';
  this.denominatorInput.size = 4;
  this.denominatorInput.id = this.div.id + 'Den';
  this.denominatorInput.className = 'hemiola-input-denominator';
  this.div.appendChild(this.denominatorInput);
};

Hemiola.prototype.setupEvents = function () {
  let self = this;

  this.button.addEventListener('click', function (e) {
    if (!self.button.disabled) {
      self.toggle();
    }
  }, false);

  this.input.addEventListener('input', function (e) {
    let tempo = parseFloat(self.input.value);
    self.input.value = tempo;
    if (!(tempo >= 0)) {
      self.input.value = 0;
      tempo = 0;
    }
    self.setTempo(tempo);
  });

  this.numeratorInput.addEventListener('input', function (e) {
    let numerator = parseInt(self.numeratorInput.value);
    self.numeratorInput.value = numerator;
    if (!(numerator >= 0)) {
      self.numeratorInput.value = 0;
      numerator = 0;
    }
    self.setNumerator(numerator);
  });

  this.denominatorInput.addEventListener('input', function (e) {
    let denominator = parseInt(self.denominatorInput.value);
    self.denominatorInput.value = denominator;
    if (!(denominator >= 0)) {
      self.denominatorInput.value = 0;
      denominator = 0;
    }
    self.setDenominator(denominator);
  });
};

Hemiola.prototype.on = function () {
  this.isPlaying = true;
  this.audioPlayer.on();
  this.button.innerHTML = 'Stop';
  this.audioPlayer.notes.push(this);
};

Hemiola.prototype.off = function () {
  this.isPlaying = false;
  this.audioPlayer.off();
  this.button.innerHTML = 'Start';
};

Hemiola.prototype.toggle = function () {
  if (this.isPlaying) {
    this.off();
  } else {
    this.on();
  }
};

Hemiola.prototype.setTempo = function (tempo) {
  this.tempo = tempo;
  if (this.tempo === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  // tempo is in beats per minute, so tempo/(60000) is beats per millisecond, and (60000*mspa)/tempo is frames per beat
  this.clickFrame = 0;
  this.clickFrameTarget = (60000)/(this.tempo*mspa);
  this.setupRatio();
};

Hemiola.prototype.setNumerator = function (numerator) {
  this.numerator = numerator;
  this.setupRatio();
};

Hemiola.prototype.setDenominator = function (denominator) {
  this.denominator = denominator;
  this.setupRatio();
};

Hemiola.prototype.setupRatio = function () {
  if (this.numerator > 0 && this.denominator > 0) {
    this.ratio = this.numerator/this.denominator;
    this.noteFrame = 0;
    this.clickFrame = 0; // reset click frame
    this.noteFrameTarget = (60000)/(this.tempo*this.ratio*mspa);
  } else {
    this.ratio = null;
    this.noteFrame = 0;
    this.noteFrameTarget = 0;
  }
};

// hemiola object is added to audioplayer
// audioplayer calls generate
Hemiola.prototype.generate = function () {
  this.clickFrame++;
  if (this.clickFrame > this.clickFrameTarget) {
    this.clickFrame -= this.clickFrameTarget;
    // play metronome click
    let note = new Tone(Notes.C7, 50, 0.1);
    note.audioPlayer = this.audioPlayer;
    note.setFormula('sine');
    note.phaseFormula = 'randomMod';
    note.phaseMod = 0.16;
    note.envelope.attack = 5;
    note.envelope.attackGain = 4;
    note.play();
  }

  if (this.noteFrameTarget > 0) {
    this.noteFrame++;
    if (this.noteFrame > this.noteFrameTarget) {
      this.noteFrame -= this.noteFrameTarget;
      let note = new Tone(Notes.C6, 50, 0.1);
      note.audioPlayer = this.audioPlayer;
      note.setFormula('sine');
      note.phaseFormula = 'randomMod';
      note.phaseMod = 0.16;
      note.envelope.attack = 5;
      note.envelope.attackGain = 4;
      note.play();
    }
  }
};