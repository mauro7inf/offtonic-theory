function AudioPlayer() {
  this.notes = []; // notes are queued here, but it will be important to keep a reference to them elsewhere to stop them
  this.globalAudioPlayer = true; // set to false for non-blocking audio player
  this.isPlaying = false;
}

AudioPlayer.prototype.on = function () {
  if (this.isPlaying) {
    return; // already on
  }
  if (this.globalAudioPlayer) {
    if (audioPlayer === this) {
      return; // already on
    }
    if (audioPlayer !== null) {
      audioPlayer.off();
    }
    audioPlayer = this;
  }
  this.scriptNode = audioCtx.createScriptProcessor(1024, 0, 1);
  this.scriptNode.connect(audioCtx.destination);
  this.scriptNode.onaudioprocess = this.createAudioCallback();
  this.notes = [];
  this.isPlaying = true;
}

AudioPlayer.prototype.off = function () {
  if (!this.isPlaying) {
    return; // already off
  }
  if (this.globalAudioPlayer) {
    if (audioPlayer !== this) {
      return; // already off
    }
    audioPlayer = null;
  }
  this.scriptNode.disconnect();
  this.scriptNode.onaudioprocess = null;
  this.scriptNode = null;
  this.notes = [];
  this.isPlaying = false;
}

AudioPlayer.prototype.createAudioCallback = function () {
  let self = this;
  return function (e) {
    let outputData = e.outputBuffer.getChannelData(0);
    for (let sample = 0; sample < e.outputBuffer.length; sample++) {
      outputData[sample] = 0;
      for (let i = 0; i < self.notes.length; i++) {
        if (self.notes[i] && self.notes[i].isPlaying) {
          if (self.notes[i].playable === false) {
            self.notes[i].generate();
          } else {
            outputData[sample] += self.notes[i].generate();
          }
        }
      }
    }
    for (let i = 0; i < self.notes.length; i++) {
      if (!(self.notes[i].isPlaying)) {
        self.notes.splice(i, 1);
        i--;
      }
    }
  }
}