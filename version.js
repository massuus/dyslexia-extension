(function() {
  function setVersion(v) {
    const el = document.getElementById('version');
    if (el) el.textContent = 'v' + v;
  }

  if (window.chrome?.runtime?.getManifest) {
    setVersion(chrome.runtime.getManifest().version);
  } else {
    fetch('manifest.json')
      .then(r => r.json())
      .then(manifest => setVersion(manifest.version))
      .catch(() => setVersion('?.?.?'));
  }
})();
