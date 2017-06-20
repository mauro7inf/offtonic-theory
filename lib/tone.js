function Tone(frequency, duration, gain) {
  this.audioPlayer = audioPlayer; // attach to the global instance by default
  this.frequency = frequency;
  this.duration = duration > 0 ? duration : null;
  this.gain = gain;
  this.formula = 'sawtooth'; // can be set to something else
  this.phaseFormula = 'linear';
  this.frame = 0; // current audio frame
  this.isPlaying = false; // set that when it's added to the notes array
  this.playable = true;
  this.phase = Math.random()*2.0*Math.PI; // start with a random phase to prevent weird effects
  this.phaseMod = 0.16; // parameter in phase modulation
  this.fourierCoeffs = [];
  this.fourierOffsets = [];
  this.shepardOctaveParameter = 5;
  this.shepardCoeffs = [];
  this.shepardOffsets = [];
  this.shepardPowers = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
  // envelope
  this.envelope = {
    attack: 10, // in ms
    decay: 10,
    // sustain is governed by duration
    release: 20, // *past* specified duration
    attackGain: 2.0 // ratio of max power after attack to sustain power
  };
  this.pwm = 1.0; // in pulse-width modulated sounds, this is the pulse width, in multiples of pi (not 2pi)

  this.filters = [];
}

// calculates relevant frame points for the envelope
Tone.prototype.calculateFrames = function () {
  this.attackUntilFrame = this.envelope.attack/mspa;
  this.decayUntilFrame = this.attackUntilFrame + this.envelope.decay/mspa;
  if (this.duration !== null) {
    this.sustainUntilFrame = this.duration/mspa;
    this.releaseUntilFrame = this.sustainUntilFrame + this.envelope.release/mspa;
  } else {
    this.sustainUntilFrame = null;
    this.releaseUntilFrame = null;
  }
};

Tone.prototype.play = function () {
  this.calculateFrames();
  this.isPlaying = true;
  this.audioPlayer.notes.push(this);
};

Tone.prototype.stop = function () {
  this.sustainUntilFrame = this.frame;
  this.releaseUntilFrame = this.sustainUntilFrame + this.envelope.release/mspa;
};

Tone.prototype.generateEnvelope = function () {
  if (this.frame < this.attackUntilFrame) {
    return (this.frame/this.attackUntilFrame)*this.envelope.attackGain;
  } else if (this.frame < this.decayUntilFrame) {
    return ((this.frame - this.attackUntilFrame)/(this.decayUntilFrame - this.attackUntilFrame))*(1.0 - this.envelope.attackGain) + this.envelope.attackGain;
  } else if (this.sustainUntilFrame === null || this.frame < this.sustainUntilFrame) {
    return 1;
  } else if (this.frame < this.releaseUntilFrame) {
    return 1.0 - (this.frame - this.sustainUntilFrame)/(this.releaseUntilFrame - this.sustainUntilFrame);
  } else {
    this.isPlaying = false;
    return 0;
  }
};

Tone.prototype.generate = function () {
  if (!this.isPlaying) return 0;
  if (typeof this.formula == 'function') return this.formula();
  let sample = 0;
  if (this.formula == 'sawtooth') sample = (this.phase/Math.PI) - 1.0;
  else if (this.formula == 'sawtooth5') sample = this.fourier();
  else if (this.formula == 'oddSawtooth5') sample = this.fourier();
  else if (this.formula == 'shepard') sample = this.shepard();
  else if (this.formula == 'shepardOctave') sample = this.shepard();
  else if (this.formula == 'square') sample = (this.phase < Math.PI) ? 1.0 : -1.0;
  else if (this.formula == 'pulse') sample = (this.phase < this.pwm*Math.PI) ? 1.0 : -1.0;
  else if (this.formula == 'sine') sample = Math.sin(this.phase);
  else if (this.formula == 'triangle') sample = 2.0*Math.abs((this.phase/Math.PI) - 1.0) - 1.0;
  else if (this.formula == 'pwmA') { // only for tones with predetermined release
    this.pwm = 1.0 - this.frame/(this.releaseUntilFrame);
    sample = (this.phase < this.pwm*Math.PI) ? 1.0 : -1.0;
  } else if (this.formula == 'white') {
    sample = 2.0*Math.random() - 1.0;
  }

  for (let i = 0; i < this.filters.length; i++) {
    sample = this.filters[i].generate(sample);
  }

  sample *= this.gain*this.generateEnvelope();

  // update
  if (this.phaseFormula == 'linear') {
    this.phase += Math.PI*this.frequency*mspa/500.0;
  } else if (this.phaseFormula == 'randomMod') {
    this.phase += (1 + this.phaseMod*(2*Math.random() - 1))*Math.PI*this.frequency*mspa/500.0;
  }
  while (this.phase > 2*Math.PI) this.phase -= 2*Math.PI;
  this.frame++;

  return sample;
};

Tone.prototype.fourier = function () {
  let sample = 0;
  for (let i = 0; i < this.fourierCoeffs.length; i++) {
    sample += this.fourierCoeffs[i]*Math.sin((i + 1)*(this.phase - this.fourierOffsets[i]));
  }
  return sample;
};

Tone.prototype.shepard = function () {
  let sample = 0;
  for (let i = 0; i < 10; i++) {
    sample += this.shepardCoeffs[i]*Math.sin(this.shepardPowers[i]*(this.phase - this.shepardOffsets[i]));
  }
  return sample;
};

Tone.prototype.setFormula = function (formula) {
  if (formula == 'sawtooth' || formula == 'square' || formula == 'sine' ||
    formula == 'triangle' || formula == 'pwmA' || formula == 'white' || formula == 'pulse') this.formula = formula;
  else if (formula == 'shepard') {
    while (this.frequency >= 2*C0) {
      this.frequency /= 2;
    }
    let log = Math.log(this.frequency/C0)/Math.log(2);
    for (let i = 0; i < 10; i++) {
      this.shepardOffsets[i] = Math.random()*2*Math.PI;
      this.shepardCoeffs[i] = Math.pow(Math.cos(Math.PI*(i + log)/10.0), 1); // cosine-based
    }
    this.formula = formula;
  } else if (formula == 'shepardOctave') {
    while (this.frequency >= 2*C0) {
      this.frequency /= 2;
    }
    for (let i = 0; i < 10; i++) {
      this.shepardOffsets[i] = Math.random()*2*Math.PI;
    }
    this.generateShepardOctaveOffsets(this.shepardOctaveParameter);
    this.formula = formula;
  } else if (formula == 'sawtooth5') {
    this.fourierCoeffs = [1, 0.5, 1.0/3.0, 0.25, 0.2];
    this.fourierOffsets = [0, 0, 0, 0, 0];
    this.formula = formula;
  } else if (formula == 'oddSawtooth5') {
    this.fourierCoeffs = [1, 0, 1.0/3.0, 0, 0.2];
    this.fourierOffsets = [0, 0, 0, 0, 0, 0, 0];
    this.formula = formula;
  } else if (typeof formula == 'function') this.formula = formula;
};

Tone.prototype.generateShepardOctaveOffsets = function (center) {
  this.shepardOctaveParamter = center;
  while (this.frequency >= 2*C0) {
    this.frequency /= 2;
  }
  let a = center;
  let b = 10 - center;
  let aa = Math.pow(a, a);
  let bb = Math.pow(b, b);
  let abab = Math.pow(a + b, a + b);
  let log = Math.log(this.frequency/C0)/Math.log(2);
  for (let i = 0; i < 10; i++) {
    let x = i + log;
    this.shepardCoeffs[i] = Math.pow(Math.pow(x/10, a)*Math.pow(1 - x/10, b)*(abab/(aa*bb)), 0.8);
  }
};

// adjusts phase offsets if necessary
Tone.prototype.adjustShepardFrequency = function (freq) {
  let newFreq = freq;
  while (newFreq >= 2*C0) {
    newFreq /= 2;
  }
  if (this.frequency - newFreq > 10) { // cross over C increasing
    this.shepardCoeffs.pop();
    this.shepardCoeffs.unshift(Math.random()*2*Math.PI);
  } else if (newFreq - this.frequency > 10) { // cross over C decreasing
    this.shepardCoeffs.shift();
    this.shepardCoeffs.push(Math.random()*2*Math.PI);
  }
  this.frequency = newFreq;
}

Tone.prototype.addFilter = function (filter) {
  this.filters.push(filter);
}

// filters (should all implement a generate(s) method that outputs a sample based on current sample s)

// cuts off a wave (presumably from -1 to 1) at the specified low and high values,
// then renormalizes the wave so that the min and max are -1 and 1
function CutoffFilter(low, high) {
  this.low = low;
  this.high = high;
  this.width = this.high - this.low;
}

CutoffFilter.prototype.generate = function (s) {
  let sample = s;
  if (sample > this.high) {
    sample = this.high;
  } else if (sample < this.low) {
    sample = this.low;
  }
  // renormalize
  sample = -1.0 + 2.0*(sample - this.low)/this.width;
  return sample;
};

// for x[n], y[n] = a0*x[n] + b1*y[n - 1]
function DelayFilter(a0, b1) {
  this.a0 = a0;
  this.b1 = b1;
  this.last = 0;
}

DelayFilter.prototype.generate = function (s) {
  let sample = this.a0*s + this.b1*this.last;
  this.last = sample;
  return sample;
}