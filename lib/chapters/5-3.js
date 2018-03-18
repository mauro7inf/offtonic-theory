document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let scaleDegreeTrainerCanvas = document.getElementById('scaledegreetrainer');
  let scaleDegreeTrainer = new ScaleDegreeTrainer(scaleDegreeTrainerCanvas);

  let intervalEarTrainerCanvas = document.getElementById('intervaleartrainer');
  let intervalEarTrainer = new IntervalEarTrainer(intervalEarTrainerCanvas);
}