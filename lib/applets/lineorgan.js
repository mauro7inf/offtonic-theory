function load() {
  let lineOrganLinearCanvas = document.getElementById('lineorganlinear');
  let lineOrganLinear = new LineOrgan(lineOrganLinearCanvas, 'linear');
  lineOrganLinear.draw();

  let lineOrganLogCanvas = document.getElementById('lineorganlogarithmic');
  let lineOrganLog = new LineOrgan(lineOrganLogCanvas, 'logarithmic');
  lineOrganLog.draw();
}