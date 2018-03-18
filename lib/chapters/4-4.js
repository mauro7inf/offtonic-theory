document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let circle1Canvas = document.getElementById('circle1');
  let circle1 = new CircleKeyboard(circle1Canvas);
  circle1.draw();
}