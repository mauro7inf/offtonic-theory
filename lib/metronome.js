// metronome should be in an empty div
function Metronome(div) {
  this.isPlaying = false;
  this.playable = false; // generate gets run but doesn't get added to any samples
  this.tempo = null;
  this.div = div;
  this.input = null;
  this.button = null;
  this.setupHtml();
  this.setupEvents();
  this.audioPlayer = new AudioPlayer();
  initNotes12TET(); // we need C7
  this.audioPlayer.globalAudioPlayer = false;

  this.frame = 0;
  this.clickFrame = 0;
}

Metronome.prototype.setupHtml = function () {
  let span = document.createElement('span');
  span.innerHTML = 'Enter metronome tempo:';
  this.div.appendChild(span);

  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.size = 5;
  this.input.id = this.div.id + 'Input';
  this.input.className = 'metronome-input';
  this.div.appendChild(this.input);

  this.button = document.createElement('button');
  this.button.innerHTML = 'Start'; // it will become 'Stop' when the metronome is on
  this.button.type = 'button';
  this.button.disabled = true;
  this.div.appendChild(this.button);
};

Metronome.prototype.setupEvents = function () {
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
};

Metronome.prototype.on = function () {
  this.isPlaying = true;
  this.audioPlayer.on();
  this.button.innerHTML = 'Stop';
  this.audioPlayer.notes.push(this);
};

Metronome.prototype.off = function () {
  this.isPlaying = false;
  this.audioPlayer.off();
  this.button.innerHTML = 'Start';
};

Metronome.prototype.toggle = function () {
  if (this.isPlaying) {
    this.off();
  } else {
    this.on();
  }
};

Metronome.prototype.setTempo = function (tempo) {
  this.tempo = tempo;
  if (this.tempo === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  // tempo is in beats per minute, so tempo/(60000) is beats per millisecond, and (60000*mspa)/tempo is frames per beat
  this.frame = 0;
  this.clickFrame = (60000)/(this.tempo*mspa);
};

// metronome object is added to audioplayer
// audioplayer calls generate
Metronome.prototype.generate = function () {
  this.frame++;
  if (this.frame > this.clickFrame) {
    this.frame -= this.clickFrame;
    // play metronome click
    let note = new Tone(Notes.C7, 50, 0.2);
    note.audioPlayer = this.audioPlayer;
    note.setFormula('sine');
    note.phaseFormula = 'randomMod';
    note.phaseMod = 0.16;
    note.envelope.attack = 5;
    note.envelope.attackGain = 4;
    note.play();
  }
};