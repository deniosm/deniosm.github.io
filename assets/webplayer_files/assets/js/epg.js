/* ================== KONSTANTE ================== */
const DEFAULT_EPG_IMAGE = "/program/no-epg.jpg";
const SCROLL_STEP = 160;

/* ================== HELPERS ================== */

/* vrati MMDD.js */
function getFileForDay(offset = 0){
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const parts = new Intl.DateTimeFormat("bs-BA", {
    timeZone: "Europe/Sarajevo",
    day: "2-digit",
    month: "2-digit"
  }).formatToParts(d);

  const dd = parts.find(p => p.type === "day").value;
  const mm = parts.find(p => p.type === "month").value;

  return `${mm}${dd}`;
}


/* ================== LOAD EPG SCRIPT ================== */

function loadEPGForCurrentChannel(){
  const channel = window.currentChannelList?.[window.currentIndex];
  if(!channel) return;

  const folder =
    document.getElementById("current-channel-epg")?.textContent?.trim()
    || channel.epg_name;

  if(!folder) return;

  // OČISTI SAMO KAD SE MIJENJA KANAL
  if(window.lastEPGFolder !== folder){
    document.querySelectorAll("script[data-epg]").forEach(s => s.remove());
    const overlay = document.querySelector(".epg-overlay");
    if(overlay) overlay.innerHTML = "";
    window.lastEPGFolder = folder;
  }

  // -1, 0, +1 dan
  [-1, 0, 1].forEach(offset=>{
    const file = getFileForDay(offset);
    const s = document.createElement("script");
    s.src = `/program/bih/${folder}/${file}.js`;
    s.async = true;
    s.dataset.epg = "1";

    s.onerror = () => { if(offset === 0) renderFallbackEPG(channel.name); };

    document.body.appendChild(s);
  });
}


/* ================== FALLBACK ================== */

function renderFallbackEPG(channelName){
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  overlay.innerHTML = "";

  for(let i=0;i<5;i++){
    const card = createCard({
      time: "--:--",
      title: i === 0 ? channelName : `Naredni program`,
      desc: "EPG nedostupan",
      image: DEFAULT_EPG_IMAGE
    });
    overlay.appendChild(card);
  }
}

/* ================== JSONP CALLBACK ================== */
/* poziva se iz epg fajlova */
function tvprogrambsb49(obj){
  renderEPGCards(obj.data.program);
}

/* ================== CORE RENDER ================== */

function renderEPGCards(html){
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const rows = [...temp.querySelectorAll(".row")];
  const now = Math.floor(Date.now()/1000);

  rows.forEach(row=>{
    const ts  = +row.dataset.ts;
    const len = +row.dataset.len;
    if(!ts || !len) return;

    const time  = row.querySelector(".time div")?.textContent || "--:--";
    const title = row.querySelector("a")?.textContent || "";
    const desc  = row.querySelector("small")?.textContent || "";
    const image = row.dataset.image || DEFAULT_EPG_IMAGE;

    const card = createCard({ time, title, desc, image });

    if(now >= ts && now < ts + len){
      const percent = ((now - ts) / len) * 100;
      card.style.setProperty("--progress", percent + "%");
      card.classList.add("current");
    }

    overlay.appendChild(card);
  });

  autoScrollToCurrent();
}


/* ================== CARD BUILDER ================== */

function createCard({time,title,desc,image}){
  const card = document.createElement("div");
  card.className = "epg-card";
  card.style.backgroundImage = `url("${image}")`;

  card.innerHTML = `
    <div class="info">
      <div class="epg-time">${time}</div>
      <div class="epg-title">${title}</div>
      <div class="epg-desc">${desc}</div>
    </div>
  `;
  return card;
}

/* ================== AUTO SCROLL ================== */

function autoScrollToCurrent(){
  const overlay = document.querySelector(".epg-overlay");
  const current = overlay?.querySelector(".epg-card.current");
  if(current){
    current.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest"
    });
  }
}

/* ================== SCROLL BUTTONS ================== */

document.addEventListener("click", e=>{
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  if(e.target.closest(".scroll-btn.left")){
    overlay.scrollBy({ left:-SCROLL_STEP, behavior:"smooth" });
  }

  if(e.target.closest(".scroll-btn.right")){
    overlay.scrollBy({ left:SCROLL_STEP, behavior:"smooth" });
  }
});

/* ================== AUTO REFRESH PROGRESS ================== */

setInterval(()=>{
  const cards = document.querySelectorAll(".epg-card");
  const now = Math.floor(Date.now()/1000);

  cards.forEach(card=>{
    const row = card.__row;
    if(!row) return;
    const ts = row.ts;
    const len = row.len;

    if(now >= ts && now < ts + len){
      const p = ((now - ts)/len)*100;
      card.style.setProperty("--progress", p + "%");
    }
  });
}, 60000);
