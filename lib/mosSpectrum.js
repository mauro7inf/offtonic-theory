// Dependencies: audioplayer.js, globals.js, tone.js

function MosSpectrum(canvas, keyboardCanvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.keyboardCanvas = keyboardCanvas;
  this.ktx = this.keyboardCanvas.getContext('2d');
  this.w = 700;
  this.h = 1200;//4798;
  this.offsetX = 50;
  this.offsetY = 50;
  this.imageData = null;
  this.dx = 5;
  this.e = 0.00000000000001; // probably too big
  this.baseFrequency = C0;
  this.kw = 700;
  this.kh = this.keyboardCanvas.height - 100; // it will change, don't worry
  this.kOffsetX = 50;
  this.kOffsetY = 50;
  this.tierBuffer = 6; // space between tiers
  this.audioPlayer = new AudioPlayer();
  this.tooltip = null;
  this.shortcuts = null;
  this.tiers = null;
  this.setupShortcuts();
  this.setupHtml();
  this.setupEvents();
  this.setupKeyboard(7/12, 12);
  this.zoomIndex = 0;
  this.offsetG = 0;
}

MosSpectrum.zoomLevels = [1200, 200, 40, 8];
MosSpectrum.gridSizes = [50, 10, 2, 0.5];
MosSpectrum.fixedSizes = [3, 3, 3, 4];

MosSpectrum.prototype.setupEvents = function () {
  let self = this;
  document.addEventListener('mousemove', function (e) {
    return self.onMouseMove(e);
  }, false);
  this.canvas.addEventListener('click', function (e) {
    return self.onClick(e);
  }, false);
  this.keyboardCanvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
  this.keyboardCanvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
};

MosSpectrum.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.drawKeyboard();
};

MosSpectrum.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  if (this.tiers !== null) {
    for (let i = 0; i < this.tiers.length; i++) {
      for (let j = 0; j < this.tiers[i].notes.length; j++) {
        this.tiers[i].notes[j].stop();
      }
    }
  }
  this.drawKeyboard();
};

MosSpectrum.prototype.setupHtml = function () {
  this.tooltip = document.createElement('div');
  this.tooltip.style.display = 'none';
  this.tooltip.style.position = 'fixed';
  this.tooltip.style.backgroundColor = '#FFFFFF';
  this.tooltip.style.color = '#000000';
  this.tooltip.style.border = '3px solid';
  this.tooltip.style.borderRadius = '5px';
  this.tooltip.style.width = 'auto';
  this.tooltip.style.height = 'auto';
  this.tooltip.style.zIndex = 10000;
  this.tooltip.style.padding = '8px';
  this.tooltip.innerHTML = 'no text';
  document.body.appendChild(this.tooltip);
};

MosSpectrum.prototype.yToG = function (y) {
  return ((y + 1)/(this.h + 1))*(MosSpectrum.zoomLevels[this.zoomIndex]/1200) + this.offsetG/1200;
};

MosSpectrum.prototype.gToY = function (g) {
  return ((g - this.offsetG/1200)/(MosSpectrum.zoomLevels[this.zoomIndex]/1200))*(this.h + 1) - 1;
}

MosSpectrum.prototype.onMouseMove = function (e) {
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left - this.offsetX;
  let y = e.clientY - rect.top - this.offsetY;
  if (x >= 0 && x <= this.w && y >= 0 && y <= this.h) {
    if (this.zoomIndex < MosSpectrum.zoomLevels.length - 1) {
      this.canvas.style.cursor = 'zoom-in';
    } else {
      this.canvas.style.cursor = 'zoom-out';
    }
    let g = this.yToG(y);
    let n = Math.floor(x/this.dx + 2);
    let mos = this.calculateMos(g, n);
    let size = mos.notes.length - 1;
    let ratio = mos.LSize/mos.sSize;
    let generatorString = 'g = ' + (1200*g).toFixed(MosSpectrum.fixedSizes[this.zoomIndex]);
    let typeString = 'n = ' + size + ' (' + mos.LCount + 'L' + mos.sCount + 's)';
    let ratioString = 'L/s = ' + ratio.toFixed(MosSpectrum.fixedSizes[this.zoomIndex]);
    let completeString = generatorString + '<br /><br />' + typeString + '<br /><br />' + ratioString;
    this.tooltip.style.top = (e.clientY + 20) + 'px';
    this.tooltip.style.left = (e.clientX + 20) + 'px';
    this.tooltip.style.display = 'block';
    this.tooltip.style.borderColor = this.calculateHue(size, 1, 0.5);
    this.tooltip.style.backgroundColor = this.calculateHue(size, 1, 0.9);
    this.tooltip.innerHTML = completeString;
  } else {
    this.tooltip.style.display = 'none';
    this.canvas.style.cursor = 'auto';
  }
};

MosSpectrum.prototype.onClick = function (e) {
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left - this.offsetX;
  let y = e.clientY - rect.top - this.offsetY;
  if (x >= 0 && x <= this.w && y >= 0 && y <= this.h) {
    this.setupKeyboard(this.yToG(y), Math.floor(x/this.dx + 2));
    this.changeZoom(this.yToG(y));
  }
};

MosSpectrum.prototype.onMouseDown = function (e) {
  e.stopPropagation();
  if (this !== activeKeyboard) {
    this.on();
  }
  let rect = this.keyboardCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let note = this.getNote(x, y);
  if (note !== null) {
    note.play();
    this.drawKeyboard();
  }
};

MosSpectrum.prototype.onMouseUp = function (e) {
  let rect = this.keyboardCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let note = this.getNote(x, y);
  if (note !== null) {
    note.stop();
    this.drawKeyboard();
  }
};

MosSpectrum.prototype.setupKeyboard = function (g, n) {
  this.g = g;
  let spec = this.generateMosSpec(g, n);
  this.createUiInfo(spec);
  this.drawKeyboard();
};

MosSpectrum.prototype.changeZoom = function (g) {
  let c = 1200*g;
  this.zoomIndex++;
  if (this.zoomIndex >= MosSpectrum.zoomLevels.length) {
    this.zoomIndex = 0;
  }
  let topG = c - MosSpectrum.zoomLevels[this.zoomIndex]/2
  let bottomG = c + MosSpectrum.zoomLevels[this.zoomIndex]/2;
  if (bottomG > 1200) {
    this.offsetG = 1200 - MosSpectrum.zoomLevels[this.zoomIndex];
  } else if (topG < 0) {
    this.offsetG = 0;
  } else {
    this.offsetG = topG;
  }
  this.imageData = null;
  this.draw();
};

MosSpectrum.prototype.draw = function () {
  this.ctx.fillStyle = 'rgb(192, 192, 192)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  if (this.imageData === null) {
    /*this.ctx.font = '48px serif';
    this.ctx.fillStyle = 'rgb(128, 128, 128)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Loading...', 400, 200);*/
    console.log('Drawing...');
    this.generateImageData();
  }

  this.ctx.strokeStyle = 'rgb(128, 128, 128)';
  this.ctx.lineWidth = 1;
  this.ctx.fillStyle = 'rgb(128, 128, 128)';
  this.ctx.textAlign = 'right';
  this.ctx.font = '12px serif';

  for (let c = 0; c < 1200; c += MosSpectrum.gridSizes[this.zoomIndex]) {
    if (c <= this.offsetG || c >= this.offsetG + MosSpectrum.zoomLevels[this.zoomIndex]) {
      continue;
    }
    let y = this.offsetY + this.gToY(c/1200);

    this.ctx.beginPath();
    this.ctx.moveTo(this.offsetX, y);
    this.ctx.lineTo(this.offsetX - 8, y);
    this.ctx.stroke();

    let label = c + '¢';
    if (c - Math.floor(c) === 0) {
      label = c + '¢';
    } else if (10*c - Math.floor(10*c + 0.0001) === 0) {
      label = (c + 0.0001).toFixed(1) + '¢';
    } else if (100*c - Math.floor(100*c + 0.0001) === 0) {
      label = (c + 0.0001).toFixed(2) + '¢';
    }
    this.ctx.fillText(label, this.offsetX - 12, y + 4);
  }

  this.ctx.putImageData(this.imageData, this.offsetX, this.offsetY);

  this.ctx.setLineDash([2,2]);
  this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';

  this.ctx.beginPath();
  this.ctx.moveTo(0, this.offsetY + this.gToY(this.g));
  this.ctx.lineTo(this.canvas.width, this.offsetY + this.gToY(this.g));
  this.ctx.stroke();

  this.ctx.textAlign = 'center';
  this.ctx.setLineDash([]);
  for (let n = 5; this.dx*(n - 2) < this.w; n += 5) {
    this.ctx.strokeStyle = this.calculateHue(n, 0.5, 0.5);
    let x = this.offsetX + this.dx*(n - 2);

    this.ctx.beginPath();
    this.ctx.moveTo(x, this.offsetY - 8);
    this.ctx.lineTo(x, this.offsetY + this.h);
    this.ctx.stroke();

    this.ctx.fillText(n, x, this.offsetY - 12);
  }
};

MosSpectrum.prototype.generateImageData = function () {
  let w = this.w;
  let h = this.h;
  this.imageData = this.ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    let g = this.yToG(y);
    for (let x = 0; x < w; x += this.dx) {
      let n = (x/this.dx) + 2;
      let color = this.calculateColor(g, n);
      let i = y*w + x;
      for (let j = 0; j < this.dx && x + j < w; j++) {
        this.imageData.data[4*(i + j)] = color.r;
        this.imageData.data[4*(i + j) + 1] = color.g;
        this.imageData.data[4*(i + j) + 2] = color.b;
        this.imageData.data[4*(i + j) + 3] = 255;
      }
    }
  }
};

MosSpectrum.prototype.hslToRgb = function (hslColor) {
  let h = hslColor.h; // from 0 to 6
  let s = hslColor.s; // 0 to 1
  let l = hslColor.l; // 0 to 1
  let c = (1 - Math.abs(2*l - 1))*s;
    let m = l - c/2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h <= 1) {
      r = c;
      g = c*h;
    } else if (h <= 2) {
      r = c*(2 - h);
      g = c;
    } else if (h <= 3) {
      g = c;
      b = c*(h - 2);
    } else if (h <= 4) {
      g = c*(4 - h);
      b = c;
    } else if (h <= 5) {
      r = c*(h - 4);
      b = c;
    } else if (h <= 6) {
      r = c;
      b = c*(6 - h);
    }

    return {r: Math.floor(256*(r + m)), g: Math.floor(256*(g + m)), b: Math.floor(256*(b + m))};
};

MosSpectrum.prototype.calculateColor = function (g, n) {
  let mos = this.calculateMos(g, n);
  let size = mos.notes.length - 1;
  let h = ((1 + Math.sqrt(5))/2)*6*(size - 2);
  while (h > 6) {
    h -= 6;
  }
  let s = Math.atan(mos.LSize/mos.sSize - 1)*(2/Math.PI);
  let l = 0.5 + 0.75*(mos.sCount/(mos.LCount + mos.sCount) - 0.5)*(s);
  if (mos.sSize === 0) {
    s = 1;
  }
  return this.hslToRgb({h: h, s: s, l: l});
};

MosSpectrum.prototype.calculateHue = function (n, a, l) {
  if (n === 1) {
    return 'rgba(' + Math.floor(255*l) + ',' + Math.floor(255*l) + ',' + Math.floor(255*l) + ',' + a + ')'; // gray
  }
  let h = ((1 + Math.sqrt(5))/2)*6*(n - 2);
  while (h > 6) {
    h -= 6;
  }
  let s = 1;
  let color = this.hslToRgb({h: h, s: s, l: l});
  return 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + a + ')';
};

MosSpectrum.prototype.calculateMos = function (g, n) {
  let notes = [0, 1];
  let currentNote = 0;
  let lastMos = {
    notes: notes.slice(),
    LSize: 1,
    sSize: 0,
    LCount: 1,
    sCount: 0
  };
  for (let i = 2; i <= n; i++) {
    currentNote += g;
    if (currentNote >= 1) {
      currentNote -= 1;
    }
    for (let j = 0; j < notes.length; j++) {
      if (currentNote > notes[j] + this.e && currentNote < notes[j + 1] - this.e) {
        notes.splice(j + 1, 0, currentNote);
        break;
      } else if (this.kindaEquals(currentNote, notes[j])) {
        return lastMos;
      }
    }
    let interval1 = notes[1] - notes[0];
    let interval2 = 0;
    let interval1Count = 1;
    let interval2Count = 0;
    let isMos = true;
    for (let j = 2; j < notes.length; j++) {
      let interval = notes[j] - notes[j - 1];
      if (this.kindaEquals(interval, interval1)) {
        interval1Count++;
      } else if (interval2 === 0) {
        interval2 = interval;
        interval2Count++;
      } else if (this.kindaEquals(interval, interval2)) {
        interval2Count++;
      } else {
        isMos = false;
        break;
      }
    }
    if (isMos) {
      if (interval1 > interval2) {
        lastMos = {
          notes: notes.slice(),
          LSize: interval1,
          sSize: interval2,
          LCount: interval1Count,
          sCount: interval2Count
        };
      } else {
        lastMos = {
          notes: notes.slice(),
          LSize: interval2,
          sSize: interval1,
          LCount: interval2Count,
          sCount: interval1Count
        };
      }
    }
  }
  return lastMos;
};

MosSpectrum.prototype.kindaEquals = function (a, b) {
  return a >= b - this.e && a <= b + this.e;
};

MosSpectrum.prototype.generateMosSpec = function (g, n) {
  let spec = [new Note({
    pitch: 0,
    tier: 0,
    n: 1,
    order: 0
  }),
  new Note({
    pitch: 1, // since we're using Shepard tones, this note, the octave, will be the same as the first; it's just here now to make calculation easier
    tier: 0,
    n: 1,
    order: 0
  })];
  let lastAbove = 0;
  let lastBelow = 0;
  let currentTier = 0;
  let currentOrder = 1;
  let nextIsAbove = true;
  for (let i = 2; i <= n; i++) {
    let pitch = 0;
    if (nextIsAbove) {
      pitch = lastAbove + g;
      while (pitch >= 1) {
        pitch -= 1;
      }
      lastAbove = pitch;
      nextIsAbove = false;
    } else {
      pitch = lastBelow - g;
      while (pitch < 0) {
        pitch += 1;
      }
      lastBelow = pitch;
      nextIsAbove = true;
    }
    let note = new Note({
      pitch: pitch,
      tier: currentTier,
      order: currentOrder++
    });
    for (let j = 0; j < spec.length; j++) {
      if (this.kindaEquals(spec[j].pitch, note.pitch)) {
        return spec;
      } else if (j < spec.length - 1 && note.pitch > spec[j].pitch && note.pitch < spec[j + 1].pitch) {
        spec.splice(j + 1, 0, note);
        break;
      }
    }
    let interval1 = spec[1].pitch - spec[0].pitch;
    let interval2 = 0;
    let interval1Count = 1;
    let interval2Count = 0;
    let isMos = true;
    for (let j = 2; j < spec.length; j++) {
      let interval = spec[j].pitch - spec[j - 1].pitch;
      if (this.kindaEquals(interval, interval1)) {
        interval1Count++;
      } else if (interval2 === 0) {
        interval2 = interval;
        interval2Count++;
      } else if (this.kindaEquals(interval, interval2)) {
        interval2Count++;
      } else {
        isMos = false;
        break;
      }
    }
    if (isMos) {
      for (let j = 0; j < spec.length; j++) {
        if (!('n' in spec[j])) {
          spec[j].n = i;
        }
      }
      if (interval2Count === 0) {
        return spec;
      }
      if ((interval1 > interval2 && interval1/interval2 < 2) || (interval1 < interval2 && interval2/interval1 < 2)) {
        currentTier++;
      }
    }
  }
  for (let j = 1; j < spec.length; j++) {
    if (!('n' in spec[j])) {
      spec.splice(j, 1);
      j--;
    }
  }
  return spec;
};

MosSpectrum.prototype.setupShortcuts = function () {
  this.shortcuts = ['['];
  let forward = ']\\asdfghjkl;\'zxcvbnm,./';
  let backward = 'poiuytrewq=-0987654321`';
  for (let i = 0; i < forward.length || i < backward.length; i++) {
    if (i < forward.length) {
      this.shortcuts.push(forward.charAt(i));
    }
    if (i < backward.length) {
      this.shortcuts.push(backward.charAt(i));
    }
  }
}

MosSpectrum.prototype.createUiInfo = function (spec) {
  let tiers = [];
  for (let j = 0; j < spec.length; j++) {
    while (spec[j].tier >= tiers.length) {
      tiers.push({notes: []});
    }
    tiers[spec[j].tier].notes.push(spec[j]);
  }
  for (let i = 0; i < tiers.length; i++) {
    // note properties
    for (let j = 0; j < tiers[i].notes.length; j++) {
      let note = tiers[i].notes[j];
      if (note.order < this.shortcuts.length) {
        note.computerKey = this.shortcuts[note.order];
      } else {
        note.computerKey = null;
      }
      if (note.n === 1) {
        note.outlineColor = 'rgba(0, 0, 0, 1)';
        note.fillColor = 'rgba(255, 255, 255, 0.8)';
      } else {
        note.outlineColor = this.calculateHue(note.n, 1, 0.5);
        note.fillColor = this.calculateHue(note.n, 0.8, 0.9);
      }
      let h = 6*note.pitch;
      if (h >= 6) {
        h -= 6;
      }
      let color = this.hslToRgb({h: h, s: 1, l: 0.5});
      note.highlightColor = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + 0.5 + ')';
      note.frequency = this.baseFrequency*Math.pow(2, note.pitch);
      note.isActive = false;
    }
    // calculate tier properties
    tiers[i].minY = 0;
    tiers[i].maxY = 0;
    let minTierInterval = this.kw; // in pixels
    for (let j = 0; j < tiers[i].notes.length; j++) {
      let note = tiers[i].notes[j];
      if (tiers[i].notes.length > 32) {
        note.r = 12;
        note.font = '16px serif';
        note.textOffset = 4;
      } else if (tiers[i].notes.length > 16) {
        note.r = 16;
        note.font = '20px serif';
        note.textOffset = 5;
      } else {
        note.r = 24;
        note.font = '28px serif';
        note.textOffset = 6;
      }
      note.x = this.kw*note.pitch;// + 40*Math.random() - 20;
      note.y = 0;// + 60*Math.random() - 30;
      if (j > 0) {
        let interval = note.x - tiers[i].notes[j - 1].x;
        if (interval < minTierInterval) {
          minTierInterval = interval;
        }
      }
    }
    let m = 4/this.kw; // px; that's actually the maximum number of whole pixels before notes start running into each other
    if (minTierInterval/this.kw < m) {
      let c = (m - minTierInterval/this.kw)/(minTierInterval/this.kw - 1/(tiers[i].notes.length + 1));
      let lastOldX = 0;
      let lastNewX = 0;
      for (let j = 0; j < tiers[i].notes.length; j++) {
        let note = tiers[i].notes[j];
        note.y = -4; // so that the line to the true position is visible
        let newX = lastNewX + (1 + c)*(note.x/this.kw - lastOldX) - c/(tiers[i].notes.length + 1);
        lastOldX = note.x/this.kw;
        lastNewX = newX;
        note.x = newX*this.kw;
      }
    }
    // now fix the y's so they don't overlap!
    tiers[i].notes.sort((note1, note2) => {
      return note1.order - note2.order; // adjust y values in order of adding the notes
    });
    for (let j = 1; j < tiers[i].notes.length; j++) {
      let r = tiers[i].notes[j].r + 2; // give some buffer; assume all notes have the same r
      let needsAdjustment = false;
      let allowable = new MathInterval([[-Infinity, Infinity]]);
      if (tiers[i].notes[j].y === -4) { // the position has been altered so that you can see the line to the real position
        allowable = (new MathInterval([[-4, 4]])).complement();
      }
      for (let k = j - 1; k >= 0; k--) {
        let dx = Math.abs(tiers[i].notes[j].x - tiers[i].notes[k].x);
        if (dx < 2*r) {
          needsAdjustment = true;
          let y = tiers[i].notes[k].y;
          let h = Math.sqrt(4*r*r - dx*dx);
          allowable = allowable.intersection((new MathInterval([[y - h, y + h]])).complement());
        }
      }
      if (needsAdjustment) {
        tiers[i].notes[j].y = allowable.closestTo(0);
      }
    }
    tiers[i].notes.sort((note1, note2) => {
      return note1.pitch - note2.pitch; // return to the pitch order
    });
    for (let j = 0; j < tiers[i].notes.length; j++) {
      let note = tiers[i].notes[j];
      if (note.y - note.r < tiers[i].minY) {
        tiers[i].minY = note.y - note.r;
      }
      if (note.y + note.r > tiers[i].maxY) {
        tiers[i].maxY = note.y + note.r;
      }
    }
  }
  // need (done correctly): radius, x position, y offset, tier width, text size
  this.tiers = tiers;
  let height = 2*this.kOffsetY;
  for (let i = 0; i < this.tiers.length; i++) {
    height += (this.tiers[i].maxY - this.tiers[i].minY);
  }
  height += this.tierBuffer*this.tiers.length + 1; // add a buffer on top for the top line
  this.keyboardCanvas.height = height;
  this.kh = height - 2*this.kOffsetY;
  let tierBottom = this.kh + this.kOffsetY;
  for (let i = 0; i < this.tiers.length; i++) {
    let y0 = tierBottom - this.tiers[i].maxY;
    tierBottom = y0 + this.tiers[i].minY - this.tierBuffer; // next tier bottom
    this.tiers[i].y0 = y0;
  }
};

MosSpectrum.prototype.drawKeyboard = function () {
  if (this === activeKeyboard) {
    this.ktx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    this.ktx.fillStyle = 'rgb(192, 192, 192)';
  }
  this.ktx.fillRect(0, 0, this.keyboardCanvas.width, this.keyboardCanvas.height);
  this.ktx.fillStyle = 'rgb(224, 224, 224)';
  this.ktx.fillRect(this.kOffsetX, this.kOffsetY, this.kw, this.kh);
  this.ktx.strokeStyle = 'rgba(0,0,0,1)';
  this.ktx.lineWidth = 2;
  this.ktx.beginPath();
  this.ktx.moveTo(this.kOffsetX, this.kOffsetY);
  this.ktx.lineTo(this.kOffsetX + this.kw, this.kOffsetY);
  this.ktx.stroke();
  let topY0 = this.tiers[this.tiers.length - 1].y0;
  for (let i = 0; i < this.tiers.length; i++) {
    this.ktx.strokeStyle = 'rgba(0,0,0,1)';
    this.ktx.lineWidth = 2;
    this.ktx.beginPath();
    this.ktx.moveTo(this.kOffsetX, this.tiers[i].y0);
    this.ktx.lineTo(this.kOffsetX + this.kw, this.tiers[i].y0);
    this.ktx.stroke();
    for (let j = 0; j < this.tiers[i].notes.length; j++) {
      let note = this.tiers[i].notes[j];
      this.ktx.strokeStyle = 'rgba(0,0,0,1)';
      this.ktx.lineWidth = 2;
      this.ktx.beginPath();
      this.ktx.moveTo(this.kOffsetX + note.x, this.tiers[i].y0 + note.y);
      this.ktx.lineTo(this.kOffsetX + this.kw*note.pitch, this.tiers[i].y0);
      this.ktx.stroke();
      this.ktx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.ktx.lineWidth = 1;
      this.ktx.beginPath();
      this.ktx.moveTo(this.kOffsetX + this.kw*note.pitch, this.tiers[i].y0);
      this.ktx.lineTo(this.kOffsetX + this.kw*note.pitch, this.kOffsetY);
      this.ktx.stroke();
    }
    for (let j = 0; j < this.tiers[i].notes.length; j++) {
      let note = this.tiers[i].notes[j];
      this.ktx.strokeStyle = note.outlineColor;
      this.ktx.lineWidth = 3;
      this.ktx.fillStyle = note.fillColor;
      this.ktx.beginPath();
      this.ktx.arc(this.kOffsetX + note.x, this.tiers[i].y0 + note.y, note.r, 0, 2*Math.PI, true);
      this.ktx.fill();
      if (note.isActive) {
        this.ktx.fillStyle = note.highlightColor;
        this.ktx.fill();
      }
      this.ktx.stroke();
      if (note.computerKey !== null) {
        this.ktx.fillStyle = 'rgba(0,0,0,1)';
        this.ktx.font = note.font;
        this.ktx.textAlign = 'center';
        this.ktx.fillText(note.computerKey, this.kOffsetX + note.x, this.tiers[i].y0 + note.y + note.textOffset);
      }
    }
  }
}

MosSpectrum.prototype.getNote = function (x, y) {
  for (let i = 0; i < this.tiers.length; i++) {
    if (y > this.tiers[i].y0 + this.tiers[i].maxY) {
      break;
    } else if (y >= this.tiers[i].y0 + this.tiers[i].minY) {
      for (let j = 0; j < this.tiers[i].notes.length; j++) {
        if (this.tiers[i].notes[j].isInNote(x - this.kOffsetX, y - this.tiers[i].y0)) {
          return this.tiers[i].notes[j];
        }
      }
    } else {
      continue;
    }
  }
  return null;
};

MosSpectrum.prototype.getKeyFromComputerKey = function (computerKey) {
  if (this.tiers === null) {
    return null;
  }
  for (let i = 0; i < this.tiers.length; i++) {
    for (let j = 0; j < this.tiers[i].notes.length; j++) {
      if (this.tiers[i].notes[j].computerKey === computerKey) {
        return this.tiers[i].notes[j];
      }
    }
  }
  return null;
};

MosSpectrum.prototype.onKeyDown = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.play();
    this.drawKeyboard();
  }
};

MosSpectrum.prototype.onKeyUp = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.stop();
    this.drawKeyboard();
  }
};

function MathInterval(intervals) {
  this.intervals = intervals; // should be an array of two-element arrays, in order
}

MathInterval.prototype.complement = function () {
  let newInterval = [];
  let current = [];
  if (this.intervals.length === 0) {
    return new MathInterval([[-Infinity, Infinity]]);
  }
  if (this.intervals[0][0] !== -Infinity) {
    newInterval.push([-Infinity, this.intervals[0][0]]);
  }
  for (let i = 1; i < 2*this.intervals.length - 1; i++) {
    let side = i % 2;
    let component = (i - side)/2;
    current.push(this.intervals[component][side]);
    if (current.length === 2) {
      newInterval.push(current);
      current = [];
    }
  }
  if (this.intervals[this.intervals.length - 1][1] !== Infinity) {
    newInterval.push([this.intervals[this.intervals.length - 1][1], Infinity]);
  }
  return new MathInterval(newInterval);
};

MathInterval.prototype.union = function (other) {
  let newInterval = [];
  if (this.intervals.length === 0) {
    return other;
  }
  for (let i = 0; i < this.intervals.length; i++) {
    newInterval.push([this.intervals[i][0], this.intervals[i][1]]);
  }
  let c = 0; // current index of newInterval
  for (let j = 0; j < other.intervals.length; j++) { // newInterval: [], other: ()
    if (c >= newInterval.length) { // done with newInterval intervals
      newInterval.push([other.intervals[j][0], other.intervals[j][1]]); // just add the new one
    } else if (other.intervals[j][1] < newInterval[c][0]) { // ( ) [ ]
      newInterval.splice(c, 0, [other.intervals[j][0], other.intervals[j][1]]); // add other behind current
      c++; // go back to same newInterval component
    } else if (other.intervals[j][0] > newInterval[c][1]) { // [ ] ( )
      j--; // repeat this component of other
      c++; // advance pointer to next component of newInterval and check that one
    } else if (other.intervals[j][0] <= newInterval[c][0] && other.intervals[j][1] <= newInterval[c][1]) { // ( [ ) ]
      newInterval[c][0] = other.intervals[j][0]; // increase the range on the left; consider this same newInterval component for next other component
    } else if (other.intervals[j][0] >= newInterval[c][0] && other.intervals[j][1] <= newInterval[c][1]) { // [ ( ) ]
      // do nothing; check next other component against same newInterval component
    } else { // ( [ ] ) or [ ( ] ) are the only remaining possibilities
      if (other.intervals[j][0] < newInterval[c][0]) {
        newInterval[c][0] = other.intervals[j][0]; // increase range on the left in case of ( [ ] )
      }
      // now deal with )
      if (c === newInterval.length - 1 || newInterval[c + 1][0] > other.intervals[j][1]) { // doesn't overlap with next component
        newInterval[c][1] = other.intervals[j][1];
        c++;
      } else { // does overlap with next component
        newInterval[c][1] = newInterval[c + 1][1]; // join the two components into one at position c
        newInterval.splice(c + 1, 1); // remove component at c + 1
        j--; // check this other interval again
      }
    }
  }
  return new MathInterval(newInterval);
};

MathInterval.prototype.intersection = function (other) {
  return this.complement().union(other.complement()).complement();
};

MathInterval.prototype.closestTo = function (x) {
  let closest = -Infinity;
  for (let i = 0; i < this.intervals.length; i++) {
    if (this.intervals[i][0] <= x && this.intervals[i][1] >= x) {
      return x; // it's in the interval
    } else if (x < this.intervals[i][0]) {
      if (x - closest <= this.intervals[i][0] - x) {
        return closest;
      } else {
        return this.intervals[i][0];
      }
    } else {
      closest = this.intervals[i][1];
    }
  }
  return closest;
};

function Note(obj) { // should probably refactor this someday, but for now, Note is kinda free-form
  for (let prop in obj) {
    this[prop] = obj[prop];
  }
  this.note = null;
}

Note.prototype.play = function () {
  this.isActive = true;
  if (this.note === null) {
    let note = new Tone(this.frequency, -1, 0.1);
    note.setFormula('shepard');
    note.play();
    this.note = note;
  }
};

Note.prototype.stop = function () {
  this.isActive = false;
  if (this.note !== null) {
    this.note.stop();
    this.note = null;
  }
};

Note.prototype.isInNote = function (x, y) {
  if ((x - this.x)*(x - this.x) + (y - this.y)*(y - this.y) <= this.r*this.r) {
    return true;
  } else {
    return false;
  }
}