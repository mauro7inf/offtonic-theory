document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let keyboard1canvas = document.getElementById('keyboard1');
  let keyboard1 = new Keyboard(keyboard1canvas);
  keyboard1.draw();

  let metronome1div = document.getElementById('metronome1');
  let metronome1 = new Metronome(metronome1div);

  let metronome2div = document.getElementById('metronome2');
  let metronome2 = new Metronome(metronome2div);
}