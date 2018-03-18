document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
	let metronome2div = document.getElementById('metronome2');
  let metronome2 = new Metronome(metronome2div);
}