function load() {
  let intervalOrganCanvas = document.getElementById('intervalorgan');
  let intervalOrgan = new IntervalOrgan(intervalOrganCanvas);
  intervalOrgan.draw();
}