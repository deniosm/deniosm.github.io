// channels-loader.js
// Učitava kanale iz JS modula, renderuje sidebar i izlaže funkcije za prev/next.

const categoryListEl = document.getElementById('category-list');
const channelListEl = document.getElementById('channel-list');
const CHANNEL_BATCH_SIZE = 15;
let allChannels = [];
window.currentChannelList = [];
window.currentIndex = -1;
window.showVideoLoader = function () {
  const video = document.getElementById("video");
  if (video) video.classList.remove("has-video");
};

window.hideVideoLoader = function () {
  const video = document.getElementById("video");
  if (video) video.classList.add("has-video");
};
// Čuva trenutno pokrenuti kanal sa runScript
let lastRunScriptChannel = null;

async function triggerRemoteScript(ch) {
  if (!ch.runScript) return true; // ništa za raditi
  try {
    const response = await fetch("http://ip+port/run.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", channel: ch.name })
    });
    if (!response.ok) throw new Error(response.statusText);
    console.log(`✅ run.sh pokrenuta za kanal ${ch.name}`);
    lastRunScriptChannel = ch;
    return true;
  } catch (err) {
    console.error("⚠️ Greška pri pokretanju run.sh:", err);
    return false;
  }
}

async function stopRemoteScript(ch) {
  if (!ch || !ch.runScript) return;
  try {
    const response = await fetch("http://ip+port/stop.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", channel: ch.name })
    });
    if (!response.ok) throw new Error(response.statusText);
    console.log(`run.sh zaustavljena za kanal ${ch.name}`);
  } catch (err) {
    console.error("Greška pri zaustavljanju run.sh:", err);
  }
}

async function playChannelWithScript(idx) {
  window.showVideoLoader();   // <-- ODMAH pokaži loader
  if (!window.currentChannelList || window.currentChannelList.length === 0) return;
  if (idx < 0) idx = 0;
  if (idx >= window.currentChannelList.length) idx = window.currentChannelList.length - 1;
  const ch = window.currentChannelList[idx];
  if (!ch) return;

  // Zaustavi prethodni runScript (ako postoji)
  if (lastRunScriptChannel && lastRunScriptChannel !== ch) {
    await stopRemoteScript(lastRunScriptChannel);
    lastRunScriptChannel = null;
  }

  // Pokreni runScript ako je potrebno
  if (ch.runScript) {
    await triggerRemoteScript(ch);
  }

  // Postavi stream
  if (window.setStream) window.setStream(ch.url);
  window.currentIndex = idx;

  // Označi i centriraj aktivni kanal
  highlightActiveChannel(idx);
  updateCurrentChannelEPG();
  loadEPGForCurrentChannel();
  updateCurrentChannelName();
}

// --- renderChannels ---
function renderChannels(category) {
  channelListEl.innerHTML = '';

  window.currentChannelList = category === "Svi kanali"
    ? allChannels.slice()
    : allChannels.filter(ch => ch.category === category);

  // rotacija ostaje
  const rotateCount = 5;
  if (window.currentChannelList.length > rotateCount) {
    const endSlice = window.currentChannelList.splice(-rotateCount);
    window.currentChannelList = [...endSlice, ...window.currentChannelList];
  }

    let rendered = 0;

    function renderBatch() {
      const slice = window.currentChannelList.slice(
        rendered,
        rendered + CHANNEL_BATCH_SIZE
      );

      slice.forEach((ch, i) => {
        appendChannelLi(ch, rendered + i);
      });

      lazyLoadImages(channelListEl);
      rendered += CHANNEL_BATCH_SIZE;

      if (rendered < window.currentChannelList.length) {
        requestIdleCallback
          ? requestIdleCallback(renderBatch)
          : setTimeout(renderBatch, 50);
      }
    }

    renderBatch();

  // autoplay prvi kanal
  if (window.currentChannelList.length > 0) {
    playChannelWithScript(rotateCount);
  }
}

function lazyLoadImages(container) {
  const imgs = container.querySelectorAll("img[data-src]");
  imgs.forEach(img => {
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  });
}
function appendChannelLi(ch, idx) {
  const li = document.createElement('li');
  li.innerHTML = `<img data-src="${ch.icon || ''}" alt="" loading="lazy">`;
  li.dataset.url = ch.url;
  li.addEventListener('click', () => playChannelWithScript(idx));
  channelListEl.appendChild(li);
}
// --- highlightActiveChannel ---
function highlightActiveChannel(idx) {
  const channelListEl = document.getElementById('channel-list');
  const items = channelListEl.querySelectorAll('li');

  if (!items.length) return;

  // 1. Oznaci aktivni element
  items.forEach((li, i) => li.classList.toggle('active', i === idx));

  // 2. Centriraj aktivni element
  const activeItem = items[idx];
  if (activeItem) {
    const container = channelListEl.parentElement;
    const containerHeight = container.clientHeight;
    const itemOffsetTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;

    // Pomjeri tako da aktivni element bude u sredini
    container.scrollTop = itemOffsetTop - containerHeight / 2 + itemHeight / 2;
  }
}

// funkcija koju pozivaju prev/next dugmad
window.playChannelByIndex = playChannelWithScript;

window.highlightActiveChannel = highlightActiveChannel;
window.renderChannels = renderChannels;

if (categoryListEl) {
  categoryListEl.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      categoryListEl.querySelectorAll('li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      renderChannels(li.textContent.trim());
    });
  });
}

// --- Učitavanje modula ---
async function loadChannels() {
  const channelFiles = [
    //'/assets/js/channels/domaci.js',
    //'/assets/js/channels/sportski.js',
    //'/assets/js/channels/sport.js',
    '/assets/js/channels/channel_list_filled.js',
  ];

  for (const file of channelFiles) {
    try {
      const module = await import(file);
      if (module && module.channelsList && Array.isArray(module.channelsList)) {
        allChannels.push(...module.channelsList);
      }
    } catch (e) {
      console.error("Greška pri učitavanju kanala:", file, e);
    }
  }

  renderChannels("Svi kanali");
}
function updateCurrentChannelEPG() {
  const el = document.getElementById("current-channel-epg");
  if (!el) return;

  const channel = window.currentChannelList[window.currentIndex];
  if (channel) {
    el.textContent = channel.epg_name;
  }
}
function updateCurrentChannelName() {
  const el = document.getElementById("channelNameBox");
  if (!el) return;

  const channel = window.currentChannelList[window.currentIndex];
  if (!channel) return;

  const img = el.querySelector("img");
  const span = el.querySelector("span");

  if (img) {
    img.src = channel.icon || "";
    img.alt = channel.name || "";
    img.style.display = channel.icon ? "" : "none";
  }

  if (span) {
    span.textContent = channel.name || "";
  }
}
(function () {
  const video = document.getElementById("video");
  if (!video) return;

  const hideLoader = () => video.classList.add("has-video");
  const showLoader = () => video.classList.remove("has-video");

  video.addEventListener("loadeddata", hideLoader);
  video.addEventListener("playing", hideLoader);

  video.addEventListener("waiting", showLoader);
  video.addEventListener("stalled", showLoader);
})();
loadChannels();

