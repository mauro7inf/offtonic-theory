document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let keyboard1Div = document.getElementById('keyboard1');
  let keyboard1 = new ScaleKeyboard(keyboard1Div);
}