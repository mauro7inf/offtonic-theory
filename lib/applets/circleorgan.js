function load() {
  let circleOrganCanvas = document.getElementById('circleorgan');
  let circleOrgan = new CircleOrgan(circleOrganCanvas);
  circleOrgan.draw();
}