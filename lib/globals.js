// constants
const audioCtx = window.AudioContext ? new AudioContext() : new webkitAudioContext(); // Safari still needs this polyfill for some reason
const mspa = 1000.0/audioCtx.sampleRate;

// not quite constants
let C0 = 440.0/Math.pow(2, 57.0/12.0);
let Notes = {}; // note constants
let audioPlayer = null; // this will be switchable, so it can't be a constant
let activeKeyboard = null;

// send keyboard events where they belong
document.addEventListener('keydown', function (e) {
  if (activeKeyboard !== null) {
    return activeKeyboard.onKeyDown(e);
  }
}, false);

document.addEventListener('keyup', function (e) {
  if (activeKeyboard !== null) {
    return activeKeyboard.onKeyUp(e);
  }
}, false);

document.addEventListener('mousedown', activeKeyboardOff, false);

window.addEventListener('blur', activeKeyboardOff, false);

function activeKeyboardOff(e) { // event handler
  if (activeKeyboard !== null) {
    activeKeyboard.off();
  }
}