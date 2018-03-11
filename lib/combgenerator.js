function CombGenerator(div) {
  this.div = div;
  this.isPlaying = false;
  this.lowFrequency = null;
  this.highFrequency = null;
  this.teeth = null;
  this.gain = null;
  this.inputLow = null;
  this.inputHigh = null;
  this.inputTeeth = null;
  this.inputGain = null;
  this.button = null;
  this.setupHtml();
  this.setupEvents();
  this.audioPlayer = new AudioPlayer();
  this.audioPlayer.globalAudioPlayer = false;
  this.tones = null;
  this.formula = 'sine';
}

CombGenerator.prototype.setupHtml = function () {
  let span = document.createElement('span');
  span.innerHTML = 'Enter lower tone frequency (Hz):';
  this.div.appendChild(span);

  this.inputLow = document.createElement('input');
  this.inputLow.type = 'text';
  this.inputLow.size = 5;
  this.inputLow.id = this.div.id + 'InputLow';
  this.inputLow.className = 'metronome-input'; // same style as metronome
  this.div.appendChild(this.inputLow);

  let span2 = document.createElement('span');
  span2.innerHTML = 'Enter upper tone frequency (Hz):';
  this.div.appendChild(span2);

  this.inputHigh = document.createElement('input');
  this.inputHigh.type = 'text';
  this.inputHigh.size = 5;
  this.inputHigh.id = this.div.id + 'InputHigh';
  this.inputHigh.className = 'metronome-input'; // same style as metronome
  this.div.appendChild(this.inputHigh);

  let span3 = document.createElement('span');
  let spaces = '';
  for (let i = 0; i < 17; i++) {
    spaces += '&nbsp;';
  }
  span3.innerHTML = spaces + 'Enter number of teeth:';
  this.div.appendChild(span3);

  this.inputTeeth = document.createElement('input');
  this.inputTeeth.type = 'text';
  this.inputTeeth.size = 5;
  this.inputTeeth.id = this.div.id + 'InputTeeth';
  this.inputTeeth.className = 'metronome-input'; // same style as metronome
  this.div.appendChild(this.inputTeeth);

  let span4 = document.createElement('span');
  let spaces2 = '';
  for (let i = 0; i < 4; i++) {
    spaces2 += '&nbsp;';
  }
  span4.innerHTML = spaces2 + 'Enter volume (ideally < 0.01):';
  this.div.appendChild(span4);

  this.inputGain = document.createElement('input');
  this.inputGain.type = 'text';
  this.inputGain.size = 5;
  this.inputGain.id = this.div.id + 'InputGain';
  this.inputGain.className = 'metronome-input'; // same style as metronome
  this.div.appendChild(this.inputGain);

  this.button = document.createElement('button');
  this.button.innerHTML = 'Start'; // it will become 'Stop' when the generator is on
  this.button.type = 'button';
  this.button.disabled = true;
  this.div.appendChild(this.button);
};

CombGenerator.prototype.setupEvents = function () {
  let self = this;

  this.button.addEventListener('click', function (e) {
    if (!self.button.disabled) {
      self.toggle();
    }
  }, false);

  this.inputLow.addEventListener('input', function (e) {
    let freq = parseFloat(self.inputLow.value);
    if (!(freq >= 0)) {
      freq = 0;
    }
    self.setLowFrequency(freq);
  });

  this.inputHigh.addEventListener('input', function (e) {
    let freq = parseFloat(self.inputHigh.value);
    if (!(freq >= 0)) {
      freq = 0;
    }
    self.setHighFrequency(freq);
  });

  this.inputTeeth.addEventListener('input', function (e) {
    let teeth = parseInt(self.inputTeeth.value);
    if (!(teeth >= 0)) {
      teeth = 0;
    }
    self.setTeeth(teeth);
  });

  this.inputGain.addEventListener('input', function (e) {
    let gain = parseFloat(self.inputGain.value);
    if (!(gain >= 0)) {
      gain = 0;
    }
    self.setGain(gain);
  });
};

CombGenerator.prototype.on = function () {
  this.isPlaying = true;
  this.audioPlayer.on();
  this.button.innerHTML = 'Stop';
  this.tones = [];
  let frequencies = this.computeFrequencies();
  for (let i = 0; i < frequencies.length; i++) {
    let gain = this.gain;
    /*if ([0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17].indexOf(i) !== -1) {
      gain /= 3;
    }*/
    let tone = new Tone(frequencies[i], -1, gain);
    tone.setFormula(this.formula);
    tone.envelope.attack = 0;
    tone.envelope.decay = 0;
    tone.envelope.release = 0;
    tone.envelope.attackGain = 1.0;
    tone.audioPlayer = this.audioPlayer;
    tone.play();
    this.tones.push(tone);
  }
};

CombGenerator.prototype.off = function () {
  this.isPlaying = false;
  if (this.tones !== null) {
    for (let i = 0; i < this.tones.length; i++) {
      this.tones[i].stop();
    }
    this.tones = null;
  }
  this.audioPlayer.off();
  this.button.innerHTML = 'Start';
};

CombGenerator.prototype.toggle = function () {
  if (this.isPlaying) {
    this.off();
  } else {
    this.on();
  }
};

CombGenerator.prototype.computeFrequencies = function () {
  let frequencies = [this.lowFrequency];
  if (this.teeth === 1) {
    return frequencies;
  }
  let ratio = Math.pow(this.highFrequency/this.lowFrequency, 1/(this.teeth - 1));
  for (let i = 1; i < this.teeth; i++) {
    frequencies.push(this.lowFrequency*Math.pow(ratio, i));
  }
  return frequencies;
};

CombGenerator.prototype.adjustFrequencies = function () {
  if (this.tones === null) {
    return;
  }
  let frequencies = this.computeFrequencies();
  for (let i = 0; i < this.tones.length; i++) {
    this.tones[i].frequency = frequencies[i];
  }
};

CombGenerator.prototype.setLowFrequency = function (freq) {
  this.lowFrequency = freq;
  if (this.lowFrequency === 0 || this.highFrequency === 0 || this.teeth === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  this.adjustFrequencies();
};

CombGenerator.prototype.setHighFrequency = function (freq) {
  this.highFrequency = freq;
  if (this.lowFrequency === 0 || this.highFrequency === 0 || this.teeth === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  this.adjustFrequencies();
};

CombGenerator.prototype.setTeeth = function (teeth) {
  this.teeth = teeth;
  if (this.lowFrequency === 0 || this.highFrequency === 0 || this.teeth === 0) {
    this.button.disabled = true;
    return this.off();
  }
  this.button.disabled = false;
  if (this.isPlaying) {
    this.off();
    this.on();
  }
};

CombGenerator.prototype.setGain = function (gain) {
  this.gain = gain;
  if (this.isPlaying) {
    this.off();
    this.on();
  }
};