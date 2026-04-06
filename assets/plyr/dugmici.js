// dugmici.js
// Samo kontrole (prev/next koristi playChannelByIndex iz channels-loader)

document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prevChannelBtn");
  const nextBtn = document.getElementById("nextChannelBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const epgBtn = document.getElementById("epgBtn");
  const closeBtn = document.getElementById("closeBtn");
  const toggleBtn = document.getElementById("sidebar-toogle");
  const sidebar = document.getElementById("sidebar-overlay");
  const controlBar = document.getElementById("control-bar");
  const controlBar2 = document.getElementById("control-bar2");
  const video = document.getElementById("video");
  const playerContainer = document.getElementById("player-container");
  const soundBtnIcon = document.getElementById("soundBtnIcon");
  const volumeSlider = document.querySelector(".volume-slider");
  const muteBtn = document.querySelector('.mute-btn');
  // Prev
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (typeof window.playChannelByIndex === 'function' && window.currentChannelList && window.currentChannelList.length) {
        const newIndex = (window.currentIndex - 1 + window.currentChannelList.length) % window.currentChannelList.length;
        window.playChannelByIndex(newIndex);
      }
    });
  }

  // Next
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (typeof window.playChannelByIndex === 'function' && window.currentChannelList && window.currentChannelList.length) {
        const newIndex = (window.currentIndex + 1) % window.currentChannelList.length;
        window.playChannelByIndex(newIndex);
      }
    });
  }

	// Fullscreen (koristi app fullscreen – isti kao fullscreen-overlay)
	if (appFullscreenBtn) {
	  appFullscreenBtn.addEventListener("click", () => {

		// ako smo u fullscreen-u → izađi
		if (document.fullscreenElement) {
		  if (typeof window.exitAppFullscreen === "function") {
		    window.exitAppFullscreen();
		  }
		  return;
		}

		// ako nismo → uđi
		if (typeof window.enterAppFullscreen === "function") {
		  window.enterAppFullscreen();
		  return;
		}

		// fallback
		if (playerContainer) {
		  playerContainer.requestFullscreen().catch(err => {
		    console.error(`Error attempting fullscreen: ${err.message}`);
		  });
		}
	  });
	}
// ================= GLOBAL SOUND CONTROL =================
if (video && soundBtnIcon && volumeSlider) {
  let lastVolume = video.volume || 1;

  function updateSoundIcon() {
    const icon = soundBtnIcon.querySelector("span");
    if (!icon) return;

    icon.className = (video.muted || video.volume === 0)
      ? "icon icon-sound-off"
      : "icon icon-sound-on";
  }

  function setVolume(vol) {
    video.volume = vol;
    video.muted = vol === 0;
    if (vol > 0) lastVolume = vol;
    volumeSlider.value = vol;
    updateSoundIcon();
  }

  function toggleMute() {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      setVolume(lastVolume || 1);
    } else {
      lastVolume = video.volume;
      setVolume(0);
    }
  }

  // Klik na dugme
  soundBtnIcon.addEventListener('click', toggleMute);

  // Slider kontrola
  volumeSlider.addEventListener('input', () => {
    setVolume(parseFloat(volumeSlider.value));
  });

  // inicijalno postavi ikonu i slider
  updateSoundIcon();
  volumeSlider.value = video.volume;

  // globalna referenca
  window.SoundControl = {
    setVolume,
    toggleMute,
    updateSoundIcon
  };
}

  // Close (close overlays)
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove('open');
      if (controlBar) controlBar.classList.remove('open');
      if (controlBar2) controlBar2.classList.remove('open');
      const epgOverlay = document.getElementById("epg-overlay");
      if (epgOverlay) epgOverlay.classList.remove('open');
    });
  }

  // Sidebar toggle button (same id as in HTML)
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle('open');
      controlBar.classList.toggle('open');
      controlBar2.classList.toggle('open');
    });
  }
});

