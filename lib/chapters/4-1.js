document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let keyboard1canvas = document.getElementById('keyboard1');
  let keyboard1 = new Keyboard(keyboard1canvas);
  keyboard1.setNoteNames(false);
  keyboard1.draw();
}