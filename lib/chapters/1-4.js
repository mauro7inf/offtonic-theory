document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
	let metronome1div = document.getElementById('metronome1');
  let metronome1 = new Metronome(metronome1div);
}