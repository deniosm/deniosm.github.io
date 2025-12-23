// player.js
// Stabilna HLS reprodukcija bez beskonačnih reload petlji

const video = document.getElementById('video');
const debugBox = document.getElementById('debug');
const sidebar = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle');
const controlBar = document.getElementById('control-bar');
const controlBar2 = document.getElementById('control-bar2');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');

let currentSrc = "";
let hls = null;

let retryTimer = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1200;

let switching = false;
let firstClickDone = false;

/* ================= DEBUG ================= */

function logDebug(msg) {
  if (debugBox) debugBox.textContent = msg;
  console.log(msg);
}

/* ================= CORE ================= */

function destroyHLS() {
  if (hls) {
    try { hls.destroy(); } catch(e){}
    hls = null;
  }
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

/* ================= LOAD STREAM ================= */

function loadStream(url) {
  if (!url) return;

  logDebug("📡 Loading stream: " + url);

  destroyHLS();
  clearRetry();

  retryCount = 0;

  if (Hls.isSupported()) {
    hls = new Hls({
      liveSyncDurationCount: 4,
      liveMaxLatencyDurationCount: 8,
      maxBufferLength: 15,
      maxBufferHole: 1.5,
      enableWorker: true,
      lowLatencyMode: false
    });

    hls.attachMedia(video);
    hls.loadSource(url);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(()=>{});
      logDebug("▶️ Stream started");
      retryCount = 0;
    });

    hls.on(Hls.Events.ERROR, onHlsError);

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(()=>{});
    logDebug("▶️ Native HLS playback");
  } else {
    logDebug("❌ HLS nije podržan");
  }
}

/* ================= HLS ERRORS ================= */

function onHlsError(event, data) {
  if (!data) return;

  console.warn("⚠️ HLS error:", data.details || data.type);

  // Ignoriši greške tokom promjene kanala
  if (switching) return;

  // BUFFER STALL ≠ reload
  if (
    data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR ||
    data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE
  ) {
    logDebug("⏸️ Buffer stalled — čekam");
    return;
  }

  // MEDIA error → pokušaj recovery
  if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
    try {
      hls.recoverMediaError();
      logDebug("🛠 Media recovery");
    } catch (e) {
      retryStream();
    }
    return;
  }

  // NETWORK error → retry (OGRANIČENO)
  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
    retryStream();
    return;
  }

  // Ostalo fatal → stop
  if (data.fatal) {
    logDebug("💥 Fatal error — stopiram stream");
    destroyHLS();
  }
}

/* ================= RETRY ================= */

function retryStream() {
  if (retryCount >= MAX_RETRIES) {
    logDebug("❌ Retry limit reached");
    return;
  }

  retryCount++;
  logDebug(`🔁 Retry ${retryCount}/${MAX_RETRIES}`);

  clearRetry();

  retryTimer = setTimeout(() => {
    if (!switching && currentSrc) {
      loadStream(currentSrc);
    }
  }, RETRY_DELAY);
}

/* ================= PUBLIC API ================= */

window.setStream = function (url) {
  if (!url || url === currentSrc) return;

  switching = true;
  clearRetry();

  currentSrc = url;
  retryCount = 0;

  video.pause();
  video.removeAttribute("src");
  video.load();

  switching = false;
  loadStream(url);
};

/* ================= FULLSCREEN / UI ================= */

async function forceLandscape() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch(e){}
}

if (fullscreenOverlay) {
  fullscreenOverlay.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      await forceLandscape();
    } catch(e){}
    firstClickDone = true;
    fullscreenOverlay.style.display = 'none';
    sidebar?.classList.add('open');
    controlBar?.classList.add('open');
    controlBar2?.classList.add('open');
  });
}

video?.addEventListener('click', () => {
  if (!firstClickDone) return;
  sidebar?.classList.toggle('open');
  controlBar?.classList.toggle('open');
  controlBar2?.classList.toggle('open');
});

toggleBtn?.addEventListener('click', e => {
  e.stopPropagation();
  sidebar?.classList.toggle('open');
  controlBar?.classList.toggle('open');
  controlBar2?.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', () => {
  sidebar?.classList.add('open');
  controlBar?.classList.add('open');
  controlBar2?.classList.toggle('open');
});

/* ================= INIT ================= */

const params = new URLSearchParams(window.location.search);
if (params.get("src")) {
  currentSrc = params.get("src");
  loadStream(currentSrc);
}

