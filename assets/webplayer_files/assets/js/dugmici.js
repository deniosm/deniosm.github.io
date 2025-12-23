// dugmici.js
// Samo kontrole (prev/next koristi playChannelByIndex iz channels-loader)

document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prevChannelBtn");
  const nextBtn = document.getElementById("nextChannelBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const epgBtn = document.getElementById("epgBtn");
  const soundBtn = document.getElementById("soundBtn");
  const closeBtn = document.getElementById("closeBtn");
  const toggleBtn = document.getElementById("sidebar-toogle");
  const sidebar = document.getElementById("sidebar-overlay");
  const controlBar = document.getElementById("control-bar");
  const controlBar2 = document.getElementById("control-bar2");
  const video = document.getElementById("video");
  const playerContainer = document.getElementById("player-container");

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

  // Fullscreen (fallback to documentElement)
  if (fullscreenBtn) {
	fullscreenBtn.addEventListener("click", () => {
	  if (!document.fullscreenElement) {
		playerContainer.requestFullscreen().catch(err => {
		  console.error(`Error attempting fullscreen: ${err.message}`);
		});
	  } else {
		document.exitFullscreen();
	  }
	});
  }

  // EPG overlay toggle (if exists)
  if (epgBtn) {
    epgBtn.addEventListener("click", () => {
      const epgOverlay = document.getElementById("epg-overlay");
      if (epgOverlay) epgOverlay.classList.toggle('open');
    });
  }

  // Mute
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      if (video) {
        video.muted = !video.muted;
        // soundBtn.textContent = video.muted ? "🔇" : "🔊";
        const soundIcon = document.getElementById("soundIcon");
        if (soundIcon) soundIcon.src = video.muted ? "/assets/icons/sound-off.svg" : "/assets/icons/sound-on.svg";
      }
    });
  }

    if (soundBtnIcon) {
      soundBtnIcon.addEventListener("click", () => {
        if (video) {
          video.muted = !video.muted;

          const icon = soundBtnIcon.querySelector("i");
          if (icon) {
            // Promijeni klasu ikone
            icon.className = video.muted ? "ri-volume-mute-fill" : "ri-volume-up-fill";
          }
        }
      });
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

