function load() {
  let keyboardCanvas = document.getElementById('keyboard');
  let keyboard = new Keyboard(keyboardCanvas);
  keyboard.draw();
}