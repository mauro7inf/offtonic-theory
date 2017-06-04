function load() {
  let sineexampleCanvas = document.getElementById('sineexample');
  let sineexample = new Graph(sineexampleCanvas, function (x) {
    return 1.1*Math.sin(5*x);
  });
  sineexample.draw();

  let toneGeneratorDiv = document.getElementById('tonegenerator');
  let toneGenerator = new ToneGenerator(toneGeneratorDiv);

  let sawtoothExampleCanvas = document.getElementById('sawtoothexample');
  let sawtoothExample = new Graph(sawtoothExampleCanvas, function (x) {
    let period = Math.PI*0.4;
    let phase = x/period - Math.floor(x/period); // 0 to 1
    return 1.1*(2*phase - 1);
  });
  sawtoothExample.draw();

  let sawtoothGeneratorDiv = document.getElementById('sawtoothgenerator');
  let sawtoothGenerator = new ToneGenerator(sawtoothGeneratorDiv);
  sawtoothGenerator.formula = 'sawtooth';

  let lineOrganLinearCanvas = document.getElementById('lineorganlinear');
  let lineOrganLinear = new LineOrgan(lineOrganLinearCanvas, 'linear');
  lineOrganLinear.draw();

  let lineOrganLogCanvas = document.getElementById('lineorganlogarithmic');
  let lineOrganLog = new LineOrgan(lineOrganLogCanvas, 'logarithmic');
  lineOrganLog.draw();

  function saw(x) {
    let period = Math.PI*0.4;
    let phase = x/period - Math.floor(x/period); // 0 to 1
    return 1.1*(2*phase - 1);
  }
  let delayedSawFactory = function (a0, b1) {
    let last = 0;
    return function (x) {
      let y = a0*saw(x) + b1*last;
      last = y;
      return y;
    };
  };
  let delayedSawtoothExampleCanvas = document.getElementById('delayedsawtoothexample');
  let delayedSawtoothExample = new Graph(delayedSawtoothExampleCanvas, delayedSawFactory(0.45, 0.6));
  delayedSawtoothExample.n = 400;
  delayedSawtoothExample.draw();

  let twosineexampleCanvas = document.getElementById('twosineexample');
  let twosineexample = new Graph(twosineexampleCanvas, [
    function (x) {
      return 1.1*Math.sin(2.5*x);
    }, function (x) {
      return 1.1*Math.sin(5*x);
    }
  ]);
  twosineexample.draw();

  let intervalOrganCanvas = document.getElementById('intervalorgan');
  let intervalOrgan = new IntervalOrgan(intervalOrganCanvas);
  intervalOrgan.draw();

  let circleOrganCanvas = document.getElementById('circleorgan');
  let circleOrgan = new CircleOrgan(circleOrganCanvas);
  circleOrgan.draw();
}