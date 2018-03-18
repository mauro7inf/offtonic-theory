document.addEventListener("DOMContentLoaded", function(e) {
  load();
});

function load() {
  let combGeneratorDiv = document.getElementById('combgenerator');
  let combGenerator = new CombGenerator(combGeneratorDiv);
}