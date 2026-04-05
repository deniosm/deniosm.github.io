// android-player.js
const video = document.getElementById('video');
const fadeEl = document.getElementById("video-fade");
const debugBox = document.getElementById('debug');
const sidebar = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle');
const controlBar = document.getElementById('control-bar');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const playPauseBtn = document.getElementById('play-pause-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const categoriesBtn = document.getElementById('categories');
const pageOverlay = document.getElementById('page-overlay');

// ================= STATE =================

let currentSrc = "";
let hls = null;
let retryTimer = null;
let retryCount = 0;
let firstClickDone = false;
let stallWatchdog = null;
let fatalRestarted = false;
let fadeTimeout = null;
let isStreamLoading = false;
// Loading state
let isLoading = false;
let streamRequestId = 0;
video.addEventListener('waiting', () => {
  isLoading = true;
  fadeEl?.classList.add("active");
  loadingSpinner?.classList.remove("hidden");
  loadingSpinner?.classList.add("active");
  playerContainer?.classList.add("blockklick");
  updateSpinner();
});

video.addEventListener('playing', () => {
  isLoading = false;
  fadeEl?.classList.remove("active");
  loadingSpinner?.classList.remove("active");
  loadingSpinner?.classList.add("hidden");
  playerContainer?.classList.remove("blockklick");
  updateSpinner();
  tryStartAutoClose();
});

function fadeIn() {
  fadeEl?.classList.add("active");
  playerContainer?.classList.add("blockklick");
  updateSpinner();
  clearTimeout(fadeTimeout);
  fadeTimeout = setTimeout(() => {
    fadeOut();
  }, 2500);
}

function fadeOut() {
  fadeEl?.classList.remove("active");
  playerContainer?.classList.remove("blockklick");

  if (fadeTimeout) {
    clearTimeout(fadeTimeout);
    fadeTimeout = null;
  }
  updateSpinner();
  tryStartAutoClose();
}
window.fadeIn = fadeIn;
let spinnerTimeout = null;

function updateSpinner() {
  const shouldShow =
    isLoading ||
    fadeEl?.classList.contains('active') ||
    playerContainer?.classList.contains('blockklick');

  clearTimeout(spinnerTimeout);

  if (shouldShow) {
    spinnerTimeout = setTimeout(() => {
      loadingSpinner?.classList.remove("hidden");
      loadingSpinner?.classList.add("active");
    }, 150); // ⬅ anti-flicker
  } else {
    loadingSpinner?.classList.remove("active");
    loadingSpinner?.classList.add("hidden");
  }
}
function startStallWatchdog() {
  stopStallWatchdog();

  stallWatchdog = setTimeout(() => {
    logDebug("Stream stalled – watchdog restart");

    fatalRestarted = false;
    retryCount = 0;

    hardResetVideo();
    loadStream(currentSrc);

  }, 12000);
}

function stopStallWatchdog() {
  if (stallWatchdog) {
    clearTimeout(stallWatchdog);
    stallWatchdog = null;
  }
}
/* ================= DEBUG ================= */

function logDebug(msg) {
  if (debugBox) debugBox.textContent = msg;
  console.log(msg);
}

// ================= CORE =================

function destroyHLS() {
  if (hls) {
    try { hls.destroy(); } catch (e) {}
    hls = null;
    video.src = "";
  }
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

// ================= HARD RESET VIDEO =================

function hardResetVideo() {
  destroyHLS();
  clearRetry();

  video.pause();
  video.removeAttribute("src");
  video.load(); // hard reset MSE + buffer + error state
}

// ================= LOAD STREAM =================

function loadStream(url) {
  if (!url) return;
  const myId = streamRequestId;
    isStreamLoading = true;
    loadingSpinner?.classList.remove("hidden");
    loadingSpinner?.classList.add("active");
  logDebug("Stream start: " + url);

  if (Hls.isSupported()) {
    hls = new Hls({
      liveSyncDuration: 3,
      maxBufferLength: 10,
      maxBufferHole: 1,
      startPosition:0,
      fragLoadingMaxRetry: 2,
      manifestLoadingMaxRetry: 2,
      levelLoadingMaxRetry: 2,
      lowLatencyMode: false
    });

    hls.attachMedia(video);
    video.currentTime = 0;
    hls.loadSource(url);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (myId !== streamRequestId) return;
      video.play().catch(() => {});
      isStreamLoading = false;
    });

    hls.on(Hls.Events.ERROR, (e, data) => {
        if (myId !== streamRequestId) return;
        if (data?.fatal) {
            logDebug(" Fatal HLS error");
            isStreamLoading = false;
            destroyHLS();

            if (!fatalRestarted) {
                // Prvi fatal error → standardni retry
                fatalRestarted = true;
                logDebug(" Fatal fallback restart");

                setTimeout(() => {
                    logDebug(" Fatal fallback restart");
                    hardResetVideo();
                    loadStream(currentSrc);
                }, 2500);

            } else if (fatalRestarted === true) {
                // Drugi fatal error → još jedan pokušaj originalnog streama odmah
                logDebug(" Fatal ponovljen – još jedan pokušaj originalnog streama");
                setTimeout(() => {
                    hardResetVideo();
                    loadStream(currentSrc);
                }, 2500); // ⬅ 2 sekunde čekanja
                // Označi da je ovo zadnji pokušaj → sljedeći put ide fallback
                fatalRestarted = "final";

            } else if (fatalRestarted === "final") {
                // Treći fatal error → fallback, ali sa malim delay-om
                logDebug(" Prebacujem na fallback stream (malo čekanja)");

                setTimeout(() => {
                    const defaultURL = "https://bosniana.org/assets/genericki/mono.m3u8";
                    fatalRestarted = false;
                    hardResetVideo();
                    loadStream(defaultURL);
                }, 500); // ⬅ 1.5 sekunde čekanja
            }
        }
    });


  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(() => {});
  } else {
    logDebug(" HLS nije podržan");
  }
}


// ================= PUBLIC API =================

window.setStream = function (url) {
  if (!url) return;

  const myId = ++streamRequestId;

  currentSrc = url;
  fatalRestarted = false;
  retryCount = 0;

  destroyHLS();
  clearRetry();

  video.pause();
  video.src = "";
  video.load();

  fadeIn();

  setTimeout(() => {
    if (myId !== streamRequestId) return; // 🔴 IGNORIŠI STARI
    loadStream(url);
  }, 150);
};
video.addEventListener("playing", () => {
  fadeOut();
});
/* ================= FULLSCREEN / UI ================= */

async function forceLandscape() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch(e){}
}

if (fullscreenOverlay) {
  fullscreenOverlay.addEventListener('click', () => {
    firstClickDone = true;

    fullscreenOverlay.style.display = 'none';

    sidebar?.classList.toggle('open');
    controlBar?.classList.toggle('open');
    resetUiAutoClose();
  });
}
video?.addEventListener('click', () => {
//  if (!firstClickDone) return;
  sidebar?.classList.toggle('open');
  controlBar?.classList.toggle('open');
  resetUiAutoClose();
});

toggleBtn?.addEventListener('click', e => {
  e.stopPropagation();
  sidebar?.classList.toggle('open');
  controlBar?.classList.toggle('open');
  resetUiAutoClose();
});

if (playPauseBtn) {
  playPauseBtn.addEventListener("click", () => {
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }

    const icon = playPauseBtn.querySelector("span");
    if (icon) {
      icon.className = video.paused
        ? "icon icon-play"
        : "icon icon-pause";
    }
  });
}

// sync ikone ako se play/pause desi izvana (HLS autoplay, error restart...)
video?.addEventListener("play", () => {
  const icon = playPauseBtn?.querySelector("span");
  if (icon) icon.className = "icon icon-pause";
});

video?.addEventListener("pause", () => {
  const icon = playPauseBtn?.querySelector("span");
  if (icon) icon.className = "icon icon-play";
});

document.addEventListener('DOMContentLoaded', () => {
  sidebar?.classList.add('open');
  controlBar?.classList.add('open');
  resetUiAutoClose();
});
video.addEventListener("playing", stopStallWatchdog);
video.addEventListener("timeupdate", stopStallWatchdog);

video.addEventListener("waiting", startStallWatchdog);
video.addEventListener("stalled", startStallWatchdog);

	window.enterAppFullscreen = async function () {
	  try {
		if (!document.fullscreenElement) {
		  await document.documentElement.requestFullscreen();
		}
		if (screen.orientation?.lock) {
		  try {
		    await screen.orientation.lock("landscape");
		  } catch(e){}
		}
	  } catch(e){}

	  firstClickDone = true;

	  // isti UI efekti kao fullscreen-overlay
	  fullscreenOverlay && (fullscreenOverlay.style.display = 'none');
	  sidebar?.classList.add('open');
	  controlBar?.classList.add('open');
	  resetUiAutoClose();
	};
	// Izlaz iz app fullscreen-a
	window.exitAppFullscreen = function () {
	  if (document.fullscreenElement) {
		document.exitFullscreen().catch(err => {
		  console.error("Exit fullscreen error:", err);
		});
	  }
	};
// ================= INIT =================
let uiAutoCloseTimer = null;
const UI_AUTO_CLOSE_DELAY = 5000; // 5 sekundi
const stopUiAutoClose = () => {
  if (uiAutoCloseTimer) {
    clearTimeout(uiAutoCloseTimer);
    uiAutoCloseTimer = null;
  }
};

function resetUiAutoClose() {
  if (pageOverlay?.classList.contains('open')) return;

  // ⬅ KLJUČNO: ako je blokirano → UGASI timer
  if (isUiBlocked()) {
    stopUiAutoClose();
    return;
  }

  stopUiAutoClose();

  uiAutoCloseTimer = setTimeout(() => {
    closeUI();
  }, UI_AUTO_CLOSE_DELAY);
}
const syncBodyClassUI = () => {
  if (!categoriesBtn) return;

  document.body.classList.toggle(
    "categories-open",
    categoriesBtn.classList.contains("open")
  );
};
function closeUI() {
  if (pageOverlay?.classList.contains('open')) return;

  if (isUiBlocked()) {
    stopUiAutoClose(); // ⬅ DODAJ OVO
    return;
  }

  if (
    sidebar?.classList.contains('open') ||
    controlBar?.classList.contains('open')
  ) {
    sidebar?.classList.remove('open');
    controlBar?.classList.remove('open');
    categoriesBtn?.classList.remove('open');

    syncBodyClassUI();
    stopUiAutoClose();
  }
}
document.addEventListener('mousemove', () => {
  if (pageOverlay?.classList.contains('open')) return;
  if (sidebar?.classList.contains('open')) {
    resetUiAutoClose();
  }
});
document.addEventListener('pointerdown', () => {
  if (pageOverlay?.classList.contains('open')) return;

  if (
    sidebar?.classList.contains('open') ||
    controlBar?.classList.contains('open')
  ) {
    resetUiAutoClose();
  }
});
document.addEventListener('wheel', () => {
  if (pageOverlay?.classList.contains('open')) return;

  if (sidebar?.classList.contains('open')) {
    resetUiAutoClose();
  }
}, { passive: true });
document.addEventListener('touchmove', () => {
  if (pageOverlay?.classList.contains('open')) return;

  if (sidebar?.classList.contains('open')) {
    resetUiAutoClose();
  }
}, { passive: true });
function isUiBlocked() {
  return (
    playerContainer?.classList.contains('blockklick') ||
    fadeEl?.classList.contains('active') ||
    isLoading ||
    isStreamLoading
  );
}
function tryStartAutoClose() {
  if (pageOverlay?.classList.contains('open')) return;
  if (isUiBlocked()) return;

  if (
    sidebar?.classList.contains('open') ||
    controlBar?.classList.contains('open')
  ) {
    resetUiAutoClose();
  }
}
window.killVideo = function () {
  logDebug("KILL VIDEO");

  // zaustavi sve procese
  stopStallWatchdog();
  clearRetry();

  // reset state
  fatalRestarted = false;
  retryCount = 0;
  isStreamLoading = false;
  isLoading = false;

  // uništi HLS + buffer
  destroyHLS();

  // HARD reset video elementa
  video.pause();
  video.removeAttribute("src");
  video.load();

  // makni vizualne stvari
  fadeEl?.classList.remove("active");
  playerContainer?.classList.remove("blockklick");

  loadingSpinner?.classList.remove("active");
  loadingSpinner?.classList.add("hidden");

  // očisti timer-e
  if (fadeTimeout) {
    clearTimeout(fadeTimeout);
    fadeTimeout = null;
  }

  updateSpinner();
};
const params = new URLSearchParams(window.location.search);
if (params.get("src")) {
  currentSrc = params.get("src");
  loadStream(currentSrc);
}
