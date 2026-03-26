const overlay = document.getElementById("page-overlay");
let frame = document.getElementById("page-frame");
const closeBtn = document.getElementById("page-overlay-close");

const playerContainer = document.getElementById("player-container");

let currentPage = null;

// NEMA redeklaracije
const rightItems = document.querySelectorAll(".right-items .bar-item");

function setActiveItem(activeId) {
  rightItems.forEach(item => item.classList.remove("active"));

  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) el.classList.add("active");
  }
}

function openPage(url, pauseVideo = true) {
  if (currentPage === url) return;

  currentPage = url;
  frame.src = url;
  overlay.classList.remove("hidden");
  overlay.classList.add("open");
  if (pauseVideo && window.video) {
    window.video.pause();
    window.video.classList.add("video-hidden");
  }
  stopUiAutoClose();
}

function closePage() {

  // hard reset iframe
  const oldFrame = document.getElementById("page-frame");
  const newFrame = oldFrame.cloneNode(false); // bez djece
  newFrame.id = "page-frame";
  newFrame.src = "";
  oldFrame.src = "about:blank";
  oldFrame.parentNode.replaceChild(newFrame, oldFrame);

  // ažuriramo globalnu referencu
  frame = newFrame;
  overlay.classList.remove("open");
  overlay.classList.add("hidden");
  currentPage = null;

  // Video vraćamo
  if (window.video) {
    window.video.classList.remove("video-hidden");
    window.video.play().catch(() => {});
  }
  stopUiAutoClose();
  // reset active
  setActiveItem("item-tv");
}

closeBtn.addEventListener("click", closePage);

// ESC za zatvaranje
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
    closePage();
  }
});

const epgBtn = document.getElementById("epgBtn");

epgBtn.addEventListener("click", () => {
  const channelDiv = document.getElementById("current-channel-epg");
  const channelName = channelDiv.textContent.trim();

  if (channelName) {
    // Uvijek učitavamo isti master HTML
    const url = `https://bosniana.org/assets/test/index.html?channel=${encodeURIComponent(channelName)}`;
    openPage(url, false);
  }
});
const barPages = {
  "item-tv": null, // TV Uživo = zatvara overlay
  "item-filmovi": "/filmovi/",
  "item-program": "/serije/",
  "item-radio": "/radio/"/*,
  "item-settings": "/settings/"*/
};
Object.entries(barPages).forEach(([id, url]) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    setActiveItem(id);   // ⭐ ACTIVE

    if (url === null) {
      closePage();      // TV Uživo
    } else {
      window.location.href = url; // ⬅ kao <a href>
    }
  });
});

setActiveItem("item-tv");

observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
