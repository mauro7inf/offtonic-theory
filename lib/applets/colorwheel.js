function load() {
  let wheelCanvas = document.getElementById('wheel');
  let wheel = new ColorWheel(wheelCanvas);
  wheel.draw();
}