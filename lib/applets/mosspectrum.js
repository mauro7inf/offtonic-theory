function load() {
  let mosSpectrumCanvas = document.getElementById('mosspectrum');
  let mosSpectrum = new MosSpectrum(mosSpectrumCanvas);
  mosSpectrum.draw();
}