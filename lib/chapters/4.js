document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let keyboard1canvas = document.getElementById('keyboard1');
  let keyboard1 = new Keyboard(keyboard1canvas);
  keyboard1.setNoteNames(false);
  keyboard1.draw();

  let keyboardSecondsCanvas = document.getElementById('keyboardseconds');
  let keyboardSeconds = new IntervalKeyboardDiagram(keyboardSecondsCanvas, 2);
  keyboardSeconds.draw();

  let keyboardSeventhsCanvas = document.getElementById('keyboardsevenths');
  let keyboardSevenths = new IntervalKeyboardDiagram(keyboardSeventhsCanvas, 7);
  keyboardSevenths.draw();

  let keyboardThirdsCanvas = document.getElementById('keyboardthirds');
  let keyboardThirds = new IntervalKeyboardDiagram(keyboardThirdsCanvas, 3);
  keyboardThirds.draw();

  let keyboardSixthsCanvas = document.getElementById('keyboardsixths');
  let keyboardSixths = new IntervalKeyboardDiagram(keyboardSixthsCanvas, 6);
  keyboardSixths.draw();

  let keyboardFourthsCanvas = document.getElementById('keyboardfourths');
  let keyboardFourths = new IntervalKeyboardDiagram(keyboardFourthsCanvas, 4);
  keyboardFourths.draw();

  let keyboardFifthsCanvas = document.getElementById('keyboardfifths');
  let keyboardFifths = new IntervalKeyboardDiagram(keyboardFifthsCanvas, 5);
  keyboardFifths.draw();

  let keyboardOctavesCanvas = document.getElementById('keyboardoctaves');
  let keyboardOctaves = new IntervalKeyboardDiagram(keyboardOctavesCanvas, 8);
  keyboardOctaves.draw();

  let keyboardAllCanvas = document.getElementById('keyboardall');
  let keyboardAll = new IntervalKeyboardDiagram(keyboardAllCanvas, 0);
  keyboardAll.draw();

  let intervalNamerCanvas = document.getElementById('intervalnamer');
  let intervalNamer = new IntervalNamer(intervalNamerCanvas);

  let circle1Canvas = document.getElementById('circle1');
  let circle1 = new CircleKeyboard(circle1Canvas);
  circle1.draw();
}