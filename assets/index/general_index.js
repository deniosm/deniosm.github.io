document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const sidebar = document.getElementById("sidebar-overlay");
  const controlBar = document.getElementById("control-bar");
  const controlBar2 = document.getElementById("control-bar2");
  const playerContainer = document.getElementById("player-container");

	document.addEventListener("keydown", (e) => {
	  if (e.key === "Escape" && document.fullscreenElement) {
		window.exitAppFullscreen();
	  }
	});

  // --- Kanali ---
  function getChannels() { return Array.from(document.querySelectorAll("#channel-list li")); }
  function getActiveIndex() { return getChannels().findIndex(c => c.classList.contains("active")); }
  function setActiveChannel(i) {
    const ch = getChannels();
    if (!ch.length) return;
    ch.forEach(c => c.classList.remove("active"));
    const newCh = ch[i];
    if (!newCh) return;
    newCh.classList.add("active");
    playStream(newCh.dataset.src);
  }

  function nextChannel() {
    if (window.currentChannelList?.length) {
      window.playChannelByIndex((window.currentIndex + 1) % window.currentChannelList.length);
    }
  }
window.allChannels = window.channelsList || []; // ili prave JS kanale
  function prevChannel() {
    if (window.currentChannelList?.length) {
      window.playChannelByIndex((window.currentIndex - 1 + window.currentChannelList.length) % window.currentChannelList.length);
    }
  }

  // --- Zvuk ---
  function toggleSound() {
    if (!video) return;
    video.muted = !video.muted;
    const soundIcon = document.getElementById("soundIcon");
    if (soundIcon) soundIcon.src = video.muted ? "https://bosniana.org/assets/dtvicons/volume-mute.svg" : "https://bosniana.org/assets/dtvicons/volume-high.svg";
  }

  // --- Sidebar show/hide ---
  function showSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (controlBar) controlBar.classList.add("open");
    if (controlBar2) controlBar2.classList.add("open");
  }

  function hideSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (controlBar) controlBar.classList.remove("open");
    if (controlBar2) controlBar2.classList.remove("open");
  }
  // --- Fullscreen: koristi dugme iz control-bar ---
  const fullscreenBtn = document.getElementById("appFullscreenBtn");
  if (fullscreenBtn) {
    window.toggleFullscreen = () => fullscreenBtn.click();
  }
  // --- Dugmad ---
  document.getElementById("closeBtn")?.addEventListener("click", hideSidebar);
  document.getElementById("sidebar-toggle")?.addEventListener("click", showSidebar);


  // --- Kad se kanali učitaju ---
  document.addEventListener("channelsLoaded", () => {
    const firstActive = document.querySelector("#channel-list li.active");
    if (firstActive) playStream(firstActive.dataset.src);
    else {
      const first = document.querySelector("#channel-list li");
      if (first) {
        first.classList.add("active");
        playStream(first.dataset.src);
      }
    }
  });

});
