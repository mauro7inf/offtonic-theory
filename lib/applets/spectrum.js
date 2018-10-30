function load() {
  let spectrumCanvas = document.getElementById('spectrum');
  let spectrum = new Spectrum(spectrumCanvas);
  spectrum.draw();
}