// Dependencies: globals.js, audioplayer.js, tone.js

function ToneGenerator(div) {
  this.div = div;
  this.isPlaying = false;
  this.frequency = null;
  this.input = null;
  this.button = null;
  this.setupHtml();
  this.setupEvents();
  this.audioPlayer = new AudioPlayer();
  this.audioPlayer.globalAudioPlayer = false;
  this.tone = null;
  this.formula = 'sine';
}

ToneGenerator.prototype.setupHtml = function () {
  let span = document.createElement('span');
  span.innerHTML = 'Enter tone frequency (Hz):';
  this.div.appendChild(span);

  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.size = 5;
  this.input.id = this.div.id + 'Input';
  this.input.className = 'metronome-input'; // same style as metronome
  this.div.appendChild(this.input);

  this.button = document.createElement('button');
  this.button.innerHTML = 'Start'; // it will become 'Stop' when the generator is on
  this.button.type = 'button';
  this.button.disabled = true;
  this.div.appendChild(this.button);

  this.div.style.width = '280px';
};

ToneGenerator.prototype.setupEvents = function () {
  let self = this;

  this.button.addEventListener('click', function (e) {
    if (!self.button.disabled) {
      self.toggle();
    }
  }, false);

  this.input.addEventListener('input', function (e) {
    let freq = parseFloat(self.input.value);
    if (!(freq >= 0)) {
      freq = 0;
    }
    self.setFrequency(freq);
  });
};

ToneGenerator.prototype.on = function () {
  this.isPlaying = true;
  this.audioPlayer.on();
  this.button.innerHTML = 'Stop';
  // create this.tone
  this.tone = new Tone(this.frequency, -1, 0.1);
  this.tone.setFormula(this.formula);
  this.tone.envelope.attack = 0;
  this.tone.envelope.decay = 0;
  this.tone.envelope.release = 0;
  this.tone.envelope.attackGain = 1.0;
  this.tone.audioPlayer = this.audioPlayer;
  this.tone.play();
};

ToneGenerator.prototype.off = function () {
  this.isPlaying = false;
  this.tone.stop();
  this.audioPlayer.off();
  this.button.innerHTML = 'Start';
};

ToneGenerator.prototype.toggle = function () {
  if (this.isPlaying) {
    this.off();
  } else {
    this.on();
  }
};

ToneGenerator.prototype.setFrequency = function (freq) {
  this.frequency = freq;
  if (this.freq === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  if (this.tone !== null) {
    this.tone.frequency = this.frequency;
  }
};