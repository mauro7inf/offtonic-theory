// canvas should have the correct dimensions: 800x800
function CircleKeyboard(canvas) {
  this.canvas = canvas;
  this.setupEvents();
  this.ctx = this.canvas.getContext('2d');
  this.audioPlayer = new AudioPlayer();
  this.keys = [];

  this.center = {
    x: 400,
    y: 400
  };
  this.maxR = 400; // radius of whole thing
  this.outerr = 300; // outer radius of main ring
  this.R = 290; // outer radius of keyboard
  this.r = 200; // inner radius of keyboard
  this.innerR = 190; // outer radius of inner keyboard
  this.innerr = 120; // inner radius of inner keyboard
  this.centerR = 110; // white hole

  this.initKeys(); // needs row info

  this.signatures = {};
  this.initSignatures(); // positions of key signatures on sprite sheet

  this.sprites = new Image();
  this.loaded = false;
  let self = this;
  this.sprites.onload = function () {
    self.loaded = true;
    self.drawSprites();
  }
  this.sprites.src = '../png/4/Sprite Sheet 2.png';
}

CircleKeyboard.prototype.on = function () {
  if (activeKeyboard !== null) {
    activeKeyboard.off(); // deactivate previous active keyboard
  }
  activeKeyboard = this; // make this one active
  this.audioPlayer.on();
  this.draw();
};

CircleKeyboard.prototype.off = function () {
  if (this === activeKeyboard) {
    activeKeyboard = null; // deactivate keyboard
  }
  this.audioPlayer.off();
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].stop();
  }
  this.draw();
};

CircleKeyboard.prototype.setupEvents = function () {
  let self = this;
  this.canvas.addEventListener('mousedown', function (e) {
    return self.onMouseDown(e);
  }, false);
  this.canvas.addEventListener('mouseup', function (e) {
    return self.onMouseUp(e);
  }, false);
  // canvas won't receive keyboard events anyway, so get them in the document and route them to the active keyboard
};

CircleKeyboard.prototype.onMouseDown = function (e) {
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

CircleKeyboard.prototype.onMouseUp = function (e) {
  e.preventDefault();
  let rect = this.canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let key = this.getKeyFromClick(x, y);
  if (key !== null) {
    key.stop();
  }
};

CircleKeyboard.prototype.onKeyDown = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.play();
  }
};

CircleKeyboard.prototype.onKeyUp = function (e) {
  e.preventDefault();
  let computerKey = e.key;
  let key = this.getKeyFromComputerKey(computerKey);
  if (key !== null) {
    key.stop();
  }
};

CircleKeyboard.prototype.draw = function () {
  let ctx = this.ctx;

  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.maxR, 0, 2*Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.outerr, 0, 2*Math.PI, false);
  ctx.closePath();
  if (this === activeKeyboard) {
    ctx.fillStyle = 'rgb(128, 128, 128)';
  } else {
    ctx.fillStyle = 'rgb(192, 192, 192)';
  }
  ctx.fill();
  for (let i = 0; i < this.keys.length; i++) {
    this.keys[i].draw();
  }

  ctx.beginPath();
  ctx.arc(this.center.x, this.center.y, this.centerR, 0, 2*Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fill();

  if (this.loaded) {
    this.drawSprites();
  }
};

CircleKeyboard.prototype.drawSprites = function () {
  let ctx = this.ctx;

  let sig = this.signatures['C'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 355, 25, sig.w, sig.h);

  sig = this.signatures['G'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 530, 70, sig.w, sig.h);

  sig = this.signatures['F'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 180, 70, sig.w, sig.h);

  sig = this.signatures['D'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w - 8, sig.h, 664, 200, sig.w - 8, sig.h);

  sig = this.signatures['Bb'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w - 8, sig.h, 55, 200, sig.w - 8, sig.h);

  sig = this.signatures['A'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 705, 373, sig.w, sig.h);

  sig = this.signatures['Eb'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 5, 373, sig.w, sig.h);

  sig = this.signatures['E'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w - 8, sig.h, 664, 547, sig.w - 8, sig.h);

  sig = this.signatures['Ab'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w - 8, sig.h, 55, 547, sig.w - 8, sig.h);

  sig = this.signatures['B'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 560, 660, sig.w*0.9, sig.h*0.9);

  sig = this.signatures['Cb'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 510, 715, sig.w*0.66, sig.h*0.66);

  sig = this.signatures['Db'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 162, 660, sig.w*0.9, sig.h*0.9);

  sig = this.signatures['C#'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 222, 715, sig.w*0.66, sig.h*0.66);

  sig = this.signatures['F#'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 404, 730, sig.w*0.85, sig.h*0.85);

  sig = this.signatures['Gb'];
  ctx.drawImage(this.sprites, sig.x, sig.y, sig.w, sig.h, 319, 730, sig.w*0.85, sig.h*0.85);

  if (false) { // set to true for debugging center dot
    let r = 350;
    ctx.fillStyle = 'rgb(255, 0, 0)';
    for (let i = 0; i < 12; i++) {
      let t = Math.PI*i/6.0;
      let point = this.polarToRectangular(r, t);
      ctx.fillRect(point.x - 4, point.y - 4, 8, 8);
    }
  }
};

CircleKeyboard.prototype.getKeyFromClick = function (x, y) {
  let polar = this.rectangularToPolar(x, y);
  
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.keyType === 'CircleKey') {
      if (polar.r < this.r - 1 || polar.r > this.R + 1) {
        continue;
      }
    } else if (key.keyType === 'CircleBlackKey') {
      if (polar.r < this.innerr - 1 || polar.r > this.innerR + 1) {
        continue;
      }
    }
    // only deal with full keys for now...
    if (key.top.left.t > key.top.right.t) {
      if (polar.t < key.top.left.t && polar.t > key.top.right.t) {
        return key;
      }
    } else { // crosses over the π/–π boundary
      if (polar.t < key.top.left.t || polar.t > key.top.right.t) {
        return key;
      }
    }
  }
  return null;
};

CircleKeyboard.prototype.getKeyFromComputerKey = function (computerKey) {
  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];
    if (key.computerKey !== null && key.computerKey === computerKey) {
      return key;
    }
  }
  return null;
};

// r measured from the center; t measured widdershins from +x axis (so -y axis is π/2)
CircleKeyboard.prototype.rectangularToPolar = function (x, y) {
  return {
    r: Math.sqrt((x - this.center.x)*(x - this.center.x) + (y - this.center.y)*(y - this.center.y)),
    t: Math.atan2((this.center.y - y), (x - this.center.x)) // 
  };
};

CircleKeyboard.prototype.polarToRectangular = function (r, t) {
  return {
    x: this.center.x + r*Math.cos(t),
    y: this.center.y - r*Math.sin(t)
  }
};

CircleKeyboard.prototype.initKeys = function () {
  initNotes12TET(); // we're assuming, yeah

  this.addKey(this.createFullKey(105, -30, Notes['C5'], 'C', 'u'));
  this.addKey(this.createFullKey(75, -30, Notes['G5'], 'G', 'i'));
  this.addKey(this.createFullKey(45, -30, Notes['D5'], 'D', 'o'));
  this.addKey(this.createFullKey(15, -30, Notes['A5'], 'A', 'p'));
  this.addKey(this.createFullKey(-15, -30, Notes['E5'], 'E', '['));
  this.addKey(this.createFullKey(-45, -30, Notes['B5'], 'Cb/B', ']'));
  this.addKey(this.createFullKey(-75, -30, Notes['Gb5'], 'Gb/F#', 'q'));
  this.addKey(this.createFullKey(-105, -30, Notes['Db5'], 'Db/C#', 'w'));
  this.addKey(this.createFullKey(-135, -30, Notes['Ab5'], 'Ab', 'e'));
  this.addKey(this.createFullKey(-165, -30, Notes['Eb5'], 'Eb', 'r'));
  this.addKey(this.createFullKey(165, -30, Notes['Bb5'], 'Bb', 't'));
  this.addKey(this.createFullKey(135, -30, Notes['F5'], 'F', 'y'));

  this.addKey(this.createMinorKey(105, -30, Notes['A5'], 'Am', null));
  this.addKey(this.createMinorKey(75, -30, Notes['E5'], 'Em', null));
  this.addKey(this.createMinorKey(45, -30, Notes['B5'], 'Bm', null));
  this.addKey(this.createMinorKey(15, -30, Notes['F#5'], 'F#m', null));
  this.addKey(this.createMinorKey(-15, -30, Notes['C#5'], 'C#m', null));
  this.addKey(this.createMinorKey(-45, -30, Notes['G#5'], 'Abm\nG#m', null));
  this.addKey(this.createMinorKey(-75, -30, Notes['D#5'], 'Ebm\nD#m', null));
  this.addKey(this.createMinorKey(-105, -30, Notes['Bb5'], 'Bbm\nA#m', null));
  this.addKey(this.createMinorKey(-135, -30, Notes['F5'], 'Fm', null));
  this.addKey(this.createMinorKey(-165, -30, Notes['C5'], 'Cm', null));
  this.addKey(this.createMinorKey(165, -30, Notes['G5'], 'Gm', null));
  this.addKey(this.createMinorKey(135, -30, Notes['D5'], 'Dm', null));
};

CircleKeyboard.prototype.createFullKey = function (t1deg, dtdeg, frequency, name, computerKey) {
  let t1 = t1deg*Math.PI/180;
  let dt = dtdeg*Math.PI/180;
  let top = {
    left: {
      r: this.R,
      t: t1
    },
    right: {
      r: this.R,
      t: t1 + dt
    },
    type: 'arc'
  };
  let bottom = {
    left: {
      r: this.r,
      t: t1
    },
    right: {
      r: this.r,
      t: t1 + dt
    },
    type: 'arc'
  };
  return new CircleKey(top, bottom, frequency, name, computerKey);
};

CircleKeyboard.prototype.createMinorKey = function (t1deg, dtdeg, frequency, name, computerKey) {
  let t1 = t1deg*Math.PI/180;
  let dt = dtdeg*Math.PI/180;
  let top = {
    left: {
      r: this.innerR,
      t: t1
    },
    right: {
      r: this.innerR,
      t: t1 + dt
    },
    type: 'arc'
  };
  let bottom = {
    left: {
      r: this.innerr,
      t: t1
    },
    right: {
      r: this.innerr,
      t: t1 + dt
    },
    type: 'arc'
  };
  let key = new CircleKey(top, bottom, frequency, name, computerKey);
  key.makeBlack();
  return key;
};

CircleKeyboard.prototype.addKey = function (key) {
  key.setKeyboard(this);
  this.keys.push(key);
};

CircleKeyboard.prototype.initSignatures = function () {
  let h = 54;
  let w = 90;
  let x = 106;

  function sig(y) {
    return {
      x: x,
      y: y,
      h: h,
      w: w
    };
  }

  this.signatures['Cb'] = sig(228);
  this.signatures['Gb'] = sig(320);
  this.signatures['Db'] = sig(412);
  this.signatures['Ab'] = sig(503);
  this.signatures['Eb'] = sig(595);
  this.signatures['Bb'] = sig(687);
  this.signatures['F'] = sig(779);
  this.signatures['C'] = sig(872);
  this.signatures['G'] = sig(965);
  this.signatures['D'] = sig(1058);
  this.signatures['A'] = sig(1150);
  this.signatures['E'] = sig(1242);
  this.signatures['B'] = sig(1334);
  this.signatures['F#'] = sig(1425);
  this.signatures['C#'] = sig(1517);

  this.signatures['C#'].w += 5; // need a bit more space here
};