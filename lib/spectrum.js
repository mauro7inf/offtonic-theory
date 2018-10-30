function Spectrum(canvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');

  this.mode = 'linear';

  this.sideMargin = 10;
  this.topMargin = 60;
  this.bottomMargin = 24;

  this.left = this.sideMargin;
  this.right = this.canvas.width - this.sideMargin;
  this.top = this.topMargin;
  this.bottom = this.canvas.height - this.bottomMargin;
  this.width = this.right - this.left; // full width
  this.height = this.bottom - this.top;

  this.logHeight = (this.height - this.bottomMargin)/2; // height of log plots: 2 of them, with a bottom margin between them
  this.upperBottom = this.top + this.logHeight;
  this.lowerTop = this.bottom - this.logHeight;

  this.controls = [
    new LinearLogButton(this.right - 180, 10, 180, this.topMargin - 20, 8, this),
    new FftSizeButton(this.right - 190 - 180, 10, 180, this.topMargin - 20, 8, this),
    new SmoothingButton(this.right - 190 - 190 - 180, 10, 180, this.topMargin - 20, 9, this)
  ];

  this.streamNode = null;
  this.analyserNode = null;
  this.buffer = null;

  this.linearGradient = null;
  this.upperLogGradient = null;
  this.lowerLogGradient = null;

  this.medGray = 'rgb(128, 128, 128)';
  this.lightGray = 'rgb(192, 192, 192)';
  this.black = 'rgb(0, 0, 0)';
  this.clearBlack = 'rgba(0, 0, 0, 0.1)';
  this.white = 'rgb(255, 255, 255)';
  this.clearWhite = 'rgba(255, 255, 255, 0.1)';

  this.fftSize = 8192;
  this.smoothingIndex = 8;
  this.smoothingConstants = ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '0.95'];

  this.setupAnalyser();
  this.setupEvents();
  this.setupMicStream();
  this.setupGradients();
  
  this.turningOn = false;
}

Spectrum.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
};

Spectrum.prototype.setupMicStream = function () {
  let self = this;
  navigator.mediaDevices.getUserMedia({audio: true})
    .then(function (stream) {
      self.streamNode = audioCtx.createMediaStreamSource(stream);
      if (activeKeyboard === self) {
        self.connectNodes();
      }
      self.draw();
    }).catch(function (error) {
      console.log('can\'t get mic');
      console.error(error);
    });
};

Spectrum.prototype.setupAnalyser = function () {
  this.analyserNode = audioCtx.createAnalyser();
  this.analyserNode.fftSize = this.fftSize;
  this.analyserNode.smoothingTimeConstant = +this.smoothingConstants[this.smoothingIndex];
  this.buffer = new Uint8Array(this.analyserNode.frequencyBinCount);
};

Spectrum.prototype.connectNodes = function () {
  if (this.streamNode === null) {
    return;
  }
  this.streamNode.connect(this.analyserNode);
};

Spectrum.prototype.disconnectNodes = function () {
  if (this.streamNode === null) {
    return;
  }
  this.streamNode.disconnect(this.analyserNode);
};

Spectrum.prototype.on = function () {
  let self = this;
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  if (this.streamNode !== null) {
    this.connectNodes();
  }
  this.turningOn = true;
  this.draw();
};

Spectrum.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.disconnectNodes();
  this.draw();
};

Spectrum.prototype.onMouseDown = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  this.controls.forEach((c) => {
    if (c.isInButton(x, y)) {
      c.onMouseDown();
    }
  });
};

Spectrum.prototype.onMouseUp = function (e) {
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  this.controls.forEach((c) => {
    if (c.isInButton(x, y)) {
      c.onMouseUp();
    }
  });
};

Spectrum.prototype.toggleMode = function () {
  if (this.mode === 'linear') {
    this.mode = 'log';
  } else if (this.mode === 'log') {
    this.mode = 'linear';
  }
  this.turningOn = true;
};

Spectrum.prototype.advanceFftSize = function () {
  this.fftSize *= 2;
  if (this.fftSize > 32768) {
    this.fftSize = 32;
  }
  if (this.analyserNode !== null) {
    this.analyserNode.fftSize = this.fftSize;
  }
  this.turningOn = true;
}

Spectrum.prototype.advanceSmoothing = function () {
  this.smoothingIndex++;
  if (this.smoothingIndex === this.smoothingConstants.length) {
    this.smoothingIndex = 0;
  }
  if (this.analyserNode !== null) {
    this.analyserNode.smoothingTimeConstant = +this.smoothingConstants[this.smoothingIndex];
  }
  this.turningOn = true;
}

Spectrum.prototype.setupGradients = function () {
  let frequencyWidth = audioCtx.sampleRate/2;

  this.linearGradient = this.ctx.createLinearGradient(this.left + 1, this.top + this.height/2, this.right - 1, this.top + this.height/2);
  this.linearGradient.addColorStop(0, this.black);

  this.upperLogGradient = this.ctx.createLinearGradient(this.left + 1, this.top + this.logHeight/2, this.right - 1, this.top + this.logHeight/2);
  this.lowerLogGradient = this.ctx.createLinearGradient(this.left + 1, this.bottom - this.logHeight/2, this.right - 1, this.bottom - this.logHeight/2);

  for (let i = 0; i <= 132; i++) {
    let frequency = C0 * Math.pow(2, i/12);
    if (frequency > frequencyWidth) {
      break;
    }
    let octavesAboveC0 = i/12; // octave-based
    let pitchClass = (i % 12)/12;
    let color = 'hsla(' + Math.floor(360*pitchClass) + ', 100%, ' + Math.floor(100*octavesAboveC0/11) + '%, 1)';
    this.linearGradient.addColorStop(frequency/frequencyWidth, color);
    if (i <= 60) {
      this.upperLogGradient.addColorStop(i/60, color);
    }
    if (i >= 60 && i <= 120) {
      this.lowerLogGradient.addColorStop((i - 60)/60, color);
    }
  }
  this.linearGradient.addColorStop(1, this.white);
};

Spectrum.prototype.draw = function () {
  if (this === activeKeyboard) {
    let self = this;
    requestAnimationFrame(function () {self.draw()});
  }

  let ctx = this.ctx;

  if (this.streamNode !== null) {
    if (this.turningOn) {
      this.drawBackground(this.medGray);
      this.drawForeground(this.black);
      this.drawGridLines(this.lightGray, true);
      this.turningOn = false;
    } else if (this !== activeKeyboard) {
      this.drawBackground(this.lightGray);
      this.drawForeground(this.black);
      this.drawGridLines(this.medGray, true);
    } else {
      // don't redraw background since we're making a fade effect
      this.drawForeground(this.clearBlack);
      this.drawGridLines(this.lightGray, false);
    }
    this.drawSpectrum();
  } else {
    let bgColor = (this === activeKeyboard) ? this.medGray : this.lightGray;
    this.drawBackground(bgColor);
    this.drawMicError();
  }
};

Spectrum.prototype.drawTitle = function () {
  let ctx = this.ctx;

  ctx.fillStyle = this.black;
  ctx.font = '48px serif';
  ctx.textAlign = 'left';
  ctx.fillText('Spectrum', 23, 44);
}

Spectrum.prototype.drawControls = function () {
  this.controls.forEach((c) => {c.draw();});
};

Spectrum.prototype.drawBackground = function (color) {
  let ctx = this.ctx;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawTitle();
  this.drawControls();
};

Spectrum.prototype.drawForeground = function (color) {
  let ctx = this.ctx;

  ctx.fillStyle = color;
  if (this.mode === 'linear') {
    ctx.fillRect(this.left, this.top, this.width, this.height);
  } else if (this.mode === 'log') {
    ctx.fillRect(this.left, this.top, this.width, this.logHeight);
    ctx.fillRect(this.left, this.lowerTop, this.width, this.logHeight);
  }
};

Spectrum.prototype.drawGridLines = function (color, drawText) {
  let ctx = this.ctx;

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  if (drawText) {
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = '10px serif';
  }
  if (this.mode === 'linear') {
    for (let i = 0; i <= 10; i++) {
      let x = (C0*Math.pow(2, i)/(audioCtx.sampleRate/2))*(this.width - 2) + this.left + 1;
      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.bottom + 6);
      ctx.stroke();
      if (drawText) {
        ctx.fillText('C' + i, x, this.bottom + 17);
      }
    }
  } else if (this.mode === 'log') {
    for (let i = 0; i <= 5; i++) {
      let x = (i/5)*(this.width - 2) + this.left + 1;
      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.upperBottom + 6);
      ctx.stroke();
      if (drawText) {
        ctx.fillText('C' + i, x, this.upperBottom + 17);
      }
    }
    for (let i = 5; i <= 10; i++) {
      let x = ((i - 5)/5)*(this.width - 2) + this.left + 1;
      ctx.beginPath();
      ctx.moveTo(x, this.lowerTop);
      ctx.lineTo(x, this.bottom + 6);
      ctx.stroke();
      if (drawText) {
        ctx.fillText('C' + i, x, this.bottom + 17);
      }
    }
  }
};

Spectrum.prototype.drawSpectrum = function () {
  let ctx = this.ctx;

  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  this.analyserNode.getByteFrequencyData(this.buffer);
  if (this.mode === 'linear') {
    ctx.strokeStyle = this.linearGradient;
    ctx.beginPath();
    for (let i = 0; i < this.analyserNode.frequencyBinCount; i++) {
      let frequency = (i/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
      let x = (frequency/(audioCtx.sampleRate/2))*(this.width - 2) + this.left + 1;
      let v = this.buffer[i]/128;
      let y = this.bottom - 1 - (v * (this.height - 2)/2);
      if (y > this.bottom - 1) {
        y = this.bottom - 1;
      }
      if (y < this.top + 1) {
        y = this.top + 1;
      }
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  } else if (this.mode === 'log') {
    let i = 0;
    let octavesAboveC0;
    // stuff below C0 doesn't show up on the graph
    for (;; i++) {
      let frequency = (i/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
      octavesAboveC0 = Math.log(frequency/C0)/Math.log(2);
      if (octavesAboveC0 > 0) {
        break;
      }
    }
    ctx.strokeStyle = this.upperLogGradient;
    ctx.beginPath();
    // interpolate value at C0
    let earlierFrequency = ((i - 1)/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
    let earlierOctaves = Math.log(earlierFrequency/C0)/Math.log(2);
    let earlierV = this.buffer[i - 1]/128;
    let v = this.buffer[i]/128;
    let intercept = v - octavesAboveC0*((v - earlierV)/(octavesAboveC0 - earlierOctaves));
    let x = this.left + 1;
    let y = this.upperBottom - 1 - (intercept * (this.logHeight - 2)/2);
    if (y < this.top + 1) {
      y = this.top + 1;
    }
    if (y > this.upperBottom - 1) {
      y = this.upperBottom - 1;
    }
    ctx.moveTo(x, y);
    // upper half
    for (;; i++) {
      let frequency = (i/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
      octavesAboveC0 = Math.log(frequency/C0)/Math.log(2);
      if (octavesAboveC0 > 5) {
        break;
      }
      x = (octavesAboveC0/5)*(this.width - 2) + this.left + 1;
      v = this.buffer[i]/128;
      y = this.upperBottom - 1 - (v * (this.logHeight - 2)/2);
      if (y < this.top + 1) {
        y = this.top + 1;
      }
      if (y > this.upperBottom - 1) {
        y = this.upperBottom - 1;
      }
      ctx.lineTo(x, y);
    }
    // interpolate value at C5
    earlierFrequency = ((i - 1)/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
    earlierOctaves = Math.log(earlierFrequency/C0)/Math.log(2);
    earlierV = v;
    v = this.buffer[i]/128;
    intercept = v + (5 - octavesAboveC0)*((v - earlierV)/(octavesAboveC0 - earlierOctaves));
    x = this.right - 1;
    y = this.upperBottom - 1 - (intercept * (this.logHeight - 2)/2);
    if (y < this.top + 1) {
      y = this.top + 1;
    }
    if (y > this.upperBottom - 1) {
      y = this.upperBottom - 1;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    // lower C5
    ctx.strokeStyle = this.lowerLogGradient;
    ctx.beginPath();
    x = this.left + 1;
    y = this.bottom - 1 - (intercept * (this.logHeight - 2)/2);
    if (y < this.lowerTop + 1) {
      y = this.lowerTop + 1;
    }
    if (y > this.bottom - 1) {
      y = this.bottom - 1;
    }
    ctx.moveTo(x, y);
    // lower half
    for (;; i++) {
      let frequency = (i/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
      octavesAboveC0 = Math.log(frequency/C0)/Math.log(2);
      if (octavesAboveC0 > 10) {
        break;
      }
      x = ((octavesAboveC0 - 5)/5)*(this.width - 2) + this.left + 1;
      v = this.buffer[i]/128;
      y = this.bottom - 1 - (v * (this.logHeight - 2)/2);
      if (y < this.lowerTop + 1) {
        y = this.lowerTop + 1;
      }
      if (y > this.bottom - 1) {
        y = this.bottom - 1;
      }
      ctx.lineTo(x, y);
    }
    // interpolate C10
    earlierFrequency = ((i - 1)/this.analyserNode.frequencyBinCount)*audioCtx.sampleRate/2;
    earlierOctaves = Math.log(earlierFrequency/C0)/Math.log(2);
    earlierV = v;
    v = this.buffer[i]/128;
    intercept = v + (10 - octavesAboveC0)*((v - earlierV)/(octavesAboveC0 - earlierOctaves));
    x = this.right - 1;
    y = this.bottom - 1 - (intercept * (this.logHeight - 2)/2);
    if (y < this.lowerTop + 1) {
      y = this.lowerTop + 1;
    }
    if (y > this.bottom - 1) {
      y = this.bottom - 1;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  }
};

Spectrum.prototype.drawMicError = function () {
  let ctx = this.ctx;

  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.textAlign = 'center';
  ctx.font = '24px serif';
  ctx.fillText('You must allow microphone use', this.canvas.width/2, 40);
  ctx.fillText('in order to run the Offtonic Spectrum.', this.canvas.width/2, 70);
  ctx.fillText('If you\'re using Chrome,', this.canvas.width/2, 130);
  ctx.fillText('click the icon next to the URL to change your settings.', this.canvas.width/2, 160);
};

function LinearLogButton(x, y, w, h, r, spectrum) {
  this.base = CanvasRoundedRectButton;
  this.base(x, y, w, h, r, spectrum.ctx);
  this.spectrum = spectrum;
  this.borderWidth = 3;
  this.strokeStyle = 'rgb(128, 128, 255)';
}
LinearLogButton.prototype = new CanvasRoundedRectButton;

LinearLogButton.prototype.draw = function () {
  let ctx = this.ctx;

  let bgColor;
  let activeTextColor = this.spectrum.black;
  let inactiveTextColor;
  if (this.spectrum === activeKeyboard) {
    bgColor = this.spectrum.lightGray;
    inactiveTextColor = this.spectrum.medGray;
  } else {
    bgColor = this.spectrum.medGray;
    inactiveTextColor = this.spectrum.lightGray;
  }

  this.fillStyle = bgColor;
  CanvasRoundedRectButton.prototype.draw.call(this);
  ctx.beginPath();
  ctx.moveTo(this.x + this.w/2, this.y);
  ctx.lineTo(this.x + this.w/2, this.y + this.h);
  ctx.stroke();

  ctx.font = '24px serif';
  ctx.textAlign = 'center';
  if (this.spectrum.mode === 'linear') {
    ctx.fillStyle = activeTextColor;
  } else {
    ctx.fillStyle = inactiveTextColor;
  }
  ctx.fillText('Linear', this.x + this.w/4, this.y + this.h - 12);
  if (this.spectrum.mode === 'log') {
    ctx.fillStyle = activeTextColor;
  } else {
    ctx.fillStyle = inactiveTextColor;
  }
  ctx.fillText('Log', this.x + 3*this.w/4, this.y + this.h - 12);


  if (this.spectrum === activeKeyboard) {
    this.fillStyle = this.spectrum.medGray;
  } else {
    this.fillStyle = this.spectrum.lightGray;
  }
};

LinearLogButton.prototype.onMouseDown = function () {};

LinearLogButton.prototype.onMouseUp = function () {
  this.spectrum.toggleMode();
};

function FftSizeButton(x, y, w, h, r, spectrum) {
  this.base = CanvasRoundedRectButton;
  this.base(x, y, w, h, r, spectrum.ctx);
  this.spectrum = spectrum;
  this.borderWidth = 3;
  this.strokeStyle = 'rgb(128, 128, 255)';
}
FftSizeButton.prototype = new CanvasRoundedRectButton;

FftSizeButton.prototype.onMouseDown = function () {};

FftSizeButton.prototype.onMouseUp = function () {
  this.spectrum.advanceFftSize();
};

FftSizeButton.prototype.draw = function () {
  let ctx = this.ctx;

  let bgColor;
  let activeTextColor = this.spectrum.black;
  let inactiveTextColor;
  if (this.spectrum === activeKeyboard) {
    bgColor = this.spectrum.lightGray;
    inactiveTextColor = this.spectrum.medGray;
  } else {
    bgColor = this.spectrum.medGray;
    inactiveTextColor = this.spectrum.lightGray;
  }

  this.fillStyle = bgColor;
  CanvasRoundedRectButton.prototype.draw.call(this);

  ctx.font = '24px serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = inactiveTextColor;
  ctx.fillText('FFT size:', this.x + 10, this.y + this.h - 12);
  ctx.textAlign = 'center';
  ctx.fillStyle = activeTextColor;
  ctx.fillText(this.spectrum.fftSize, this.x + 140, this.y + this.h - 12);
}

function SmoothingButton(x, y, w, h, r, spectrum) {
  this.base = CanvasRoundedRectButton;
  this.base(x, y, w, h, r, spectrum.ctx);
  this.spectrum = spectrum;
  this.borderWidth = 3;
  this.strokeStyle = 'rgb(128, 128, 255)';
}
SmoothingButton.prototype = new CanvasRoundedRectButton;

SmoothingButton.prototype.onMouseDown = function () {};

SmoothingButton.prototype.onMouseUp = function () {
  this.spectrum.advanceSmoothing();
};

SmoothingButton.prototype.draw = function () {
  let ctx = this.ctx;

  let bgColor;
  let activeTextColor = this.spectrum.black;
  let inactiveTextColor;
  if (this.spectrum === activeKeyboard) {
    bgColor = this.spectrum.lightGray;
    inactiveTextColor = this.spectrum.medGray;
  } else {
    bgColor = this.spectrum.medGray;
    inactiveTextColor = this.spectrum.lightGray;
  }

  this.fillStyle = bgColor;
  CanvasRoundedRectButton.prototype.draw.call(this);

  ctx.font = '24px serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = inactiveTextColor;
  ctx.fillText('Smoothing:', this.x + 10, this.y + this.h - 12);
  ctx.textAlign = 'center';
  ctx.fillStyle = activeTextColor;
  ctx.fillText(this.spectrum.smoothingConstants[this.spectrum.smoothingIndex], this.x + 150, this.y + this.h - 12);
}