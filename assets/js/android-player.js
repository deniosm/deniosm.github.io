const video = document.getElementById('video');
const fadeEl = document.getElementById("video-fade");
const debugBox = document.getElementById('debug');
const sidebar = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle');
const controlBar = document.getElementById('control-bar');
const controlBar2 = document.getElementById('control-bar2');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const playPauseBtn = document.getElementById('play-pause-btn');
// ================= STATE =================

let currentSrc = "";
let hls = null;
let retryTimer = null;
let retryCount = 0;
let firstClickDone = false;
let stallWatchdog = null;
let fatalRestarted = false;

function fadeIn() {
  fadeEl?.classList.add("active");
}

function fadeOut() {
  fadeEl?.classList.remove("active");
}


function startStallWatchdog() {
  stopStallWatchdog();

  stallWatchdog = setTimeout(() => {
    logDebug("Stream stalled – fallback restart");
    hardResetVideo();
    loadStream(currentSrc);
  }, 12000); // 4s bez pomaka
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

  logDebug("📡 Stream start: " + url);

  destroyHLS();
  clearRetry();

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false
    });

    hls.attachMedia(video);
    hls.loadSource(url);

	hls.on(Hls.Events.MANIFEST_PARSED, () => {
	  video.play().catch(() => {});
	  fadeOut(); // 🎬 slika spremna
	});

	hls.on(Hls.Events.LEVEL_LOADED, () => {
	  fadeOut(); // fallback ako manifest kasni
	});


    hls.on(Hls.Events.ERROR, (e, data) => {
        if (data?.fatal) {
            logDebug("💥 Fatal HLS error");

            destroyHLS();

            if (!fatalRestarted) {
                // Prvi fatal error → standardni retry
                fatalRestarted = true;
                logDebug("🔁 Fatal fallback restart");

                setTimeout(() => {
                    logDebug("🔁 Fatal fallback restart");
                    hardResetVideo();
                    loadStream(currentSrc);
                }, 2500);

            } else if (fatalRestarted === true) {
                // Drugi fatal error → još jedan pokušaj originalnog streama odmah
                logDebug("⛔ Fatal ponovljen – još jedan pokušaj originalnog streama");
                setTimeout(() => {
                    hardResetVideo();
                    loadStream(currentSrc);
                }, 2500); // ⬅ 2 sekunde čekanja
                // Označi da je ovo zadnji pokušaj → sljedeći put ide fallback
                fatalRestarted = "final";

            } else if (fatalRestarted === "final") {
                // Treći fatal error → fallback, ali sa malim delay-om
                logDebug("🚑 Prebacujem na fallback stream (malo čekanja)");

                setTimeout(() => {
                    const defaultURL = "https://bosniana.org/assets/genericki/mono.m3u8";
                    fatalRestarted = false;
                    hardResetVideo();
                    loadStream(defaultURL);
                }, 1500); // ⬅ 1.5 sekunde čekanja
            }
        }
    });


  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(() => {});
  } else {
    logDebug("❌ HLS nije podržan");
  }
}


// ================= PUBLIC API =================

window.setStream = function (url) {
  if (!url || url === currentSrc) return;

  currentSrc = url;
  fatalRestarted = true;
  retryCount = 0;

  fadeIn(); // ⬛ zamrači ekran

  // zadrži stari frame ~300ms
  setTimeout(() => {
    destroyHLS();
    clearRetry();
    loadStream(url);
  }, 1250);
};



/* ================= FULLSCREEN / UI ================= */

async function forceLandscape() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch(e){}
}
/*  IZBACENO ZBOG ANDROID APP
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
*/
    // RUČNO odradi ono što bi video click uradio -- NOVA FUNKCIJA TOGGLE NA PRVI KLIK
if (fullscreenOverlay) {
  fullscreenOverlay.addEventListener('click', () => {
    firstClickDone = true;

    fullscreenOverlay.style.display = 'none';

    // RUČNO odradi ono što bi video click uradio
    sidebar?.classList.toggle('open');
    controlBar?.classList.toggle('open');
    controlBar2?.classList.toggle('open');
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
  controlBar2?.classList.toggle('open');
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
	  controlBar2?.classList.add('open');
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

const params = new URLSearchParams(window.location.search);
if (params.get("src")) {
  currentSrc = params.get("src");
  loadStream(currentSrc);
}
