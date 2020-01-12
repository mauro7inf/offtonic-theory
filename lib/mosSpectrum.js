function MosSpectrum(canvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.w = 700;
  this.h = 1200;//4798;
  this.offsetX = 50;
  this.offsetY = 50;
  this.imageData = null;
  this.dx = 6;
  this.e = 0.00000000000001; // probably too big
  this.tooltip = null;
  this.setupHtml();
  this.setupEvents();
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
    this.tooltip.style.backgroundColor = this.calculateHue(size, 1, 0.85);
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
    this.changeZoom(this.yToG(y));
  }
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
  console.log('drawing');
  if (this.imageData === null) {
    /*this.ctx.font = '48px serif';
    this.ctx.fillStyle = 'rgb(128, 128, 128)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Loading...', 400, 200);*/
    this.generateImageData();
  }
  this.ctx.fillStyle = 'rgb(192, 192, 192)';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
  this.ctx.textAlign = 'center';
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

MosSpectrum.prototype.buildMosDescription = function (mos) {
  //
};