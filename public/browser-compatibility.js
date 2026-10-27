// Keep this file ES5-compatible: it must run even when the application bundle
// cannot start. It intentionally has no dependency on React or browser storage.
(function () {
  var ua = navigator.userAgent || "";
  var match;
  var unsupported = /MSIE|Trident\//.test(ua);

  // Every iOS browser uses the system WebKit engine, regardless of its brand.
  if (/iPhone|iPad|iPod/.test(ua)) {
    match = ua.match(/OS (\d+)[_.](\d+)/);
    if (match) {
      unsupported = Number(match[1]) < 16 ||
        (Number(match[1]) === 16 && Number(match[2]) < 4);
    }
  } else if ((match = ua.match(/Firefox\/(\d+)/))) {
    unsupported = Number(match[1]) < 128;
  } else if ((match = ua.match(/(?:Chrome|Chromium)\/(\d+)/))) {
    unsupported = Number(match[1]) < 111;
  } else if (/Safari\//.test(ua) && (match = ua.match(/Version\/(\d+)(?:\.(\d+))?/))) {
    unsupported = Number(match[1]) < 16 ||
      (Number(match[1]) === 16 && Number(match[2] || 0) < 4);
  }

  if (unsupported || !navigator.locks || typeof navigator.locks.request !== "function") {
    document.documentElement.setAttribute("data-sandu-browser", "unsupported");
  }
}());
