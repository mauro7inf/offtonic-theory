function load() {
  let mosSpectrumCanvas = document.getElementById('mosspectrum');
  let mosKeyboardCanvas = document.getElementById('moskeyboard');
  let mosSpectrum = new MosSpectrum(mosSpectrumCanvas, mosKeyboardCanvas);
  mosSpectrum.draw();
}