/* ================== KONSTANTE ================== */
const DEFAULT_EPG_IMAGE = "https://bosniana.org/assets/dtvicons/no-epg.jpg";
const SCROLL_STEP = 160;

/* ================== HELPERS ================== */
function getFileForDay(offset = 0){
  const d = new Date();
  d.setHours(12, 0, 0, 0); // zaštita od DST i ponoćnih bugova
  d.setDate(d.getDate() + offset);

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${mm}${dd}`;
}

/* ================== LOAD EPG SCRIPT ================== */
function loadEPGForCurrentChannel(){
  window.epgTriedYesterday = false;
  const channel = window.currentChannelList?.[window.currentIndex];
  if(!channel) {
//    console.log(" Nema trenutno izabranog kanala za EPG");
    return;
  }

  const folder =
    document.getElementById("current-channel-epg")?.textContent?.trim()
    || channel.epg_name;

  if(!folder){
//    console.log(" Nema foldera za EPG");
    return;
  }

  // --- BLOKIRAJ PONOVNO UČITAVANJE ISTOG KANALA ---
  if(window.lastEPGFolder === folder && window.lastEPGChannel === channel.name){
//    console.log(`EPG za kanal '${channel.name}' već je učitan, preskačem`);
    return;
  }

  // --- OČISTI PRETHODNI EPG ---
//  console.log(" Očišćen prethodni EPG folder:", window.lastEPGFolder);
  document.querySelectorAll("script[data-epg]").forEach(s => s.remove());
  const overlay = document.querySelector(".epg-overlay");
  if(overlay) overlay.innerHTML = "";

  window.lastEPGFolder = folder;
  window.lastEPGChannel = channel.name;

  // --- UČITAJ -1, 0, +1 dan ---
  //[-1, 0, 1].forEach(offset=>{
  // --- Samo trenutni dan ---
  const offsets = [0]; // prvo probaj današnji
  offsets.forEach(offset=>{
    const file = getFileForDay(offset);
    const s = document.createElement("script");
    s.src = `https://bosniana.org/assets/test/${folder}/${file}.js`;
    s.async = true;
    s.dataset.epg = "1";

//    s.onload = () => console.log(` EPG script loaded: ${s.src}`);
    s.onerror = (e) => {
//      console.warn(` Greška pri učitavanju EPG script: ${s.src}`, e);
      if(offset === 0) renderFallbackEPG(channel.name);
    };

    document.body.appendChild(s);
  });
}

/* ================== FALLBACK ================== */
function renderFallbackEPG(channelName){
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  overlay.innerHTML = "";
//  console.warn(" Fallback EPG render:", channelName);

  for(let i=0;i<5;i++){
    const card = createCard({
      time: "--:--",
      title: i === 0 ? channelName : `DeniTV Global`,
      desc: "EPG nedostupan",
      image: DEFAULT_EPG_IMAGE
    });
    overlay.appendChild(card);
  }
}

/* ================== JSONP CALLBACK ================== */
function tvprogrambsb49(obj){
//  console.log(" EPG JSONP callback pozvan", obj);
  if(obj?.data?.program) renderEPGCards(obj.data.program);
  else console.warn(" EPG data nedostupna", obj);
}

/* ================== CORE RENDER ================== */
function renderEPGCards(html){
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const rows = [...temp.querySelectorAll(".row")];
  const now = Math.floor(Date.now()/1000);

//  console.log(` renderEPGCards: učitano ${rows.length} programa`);

  rows.forEach(row=>{
    const ts  = +row.dataset.ts;
    const len = +row.dataset.len;
    if(!ts || !len) return;

    const time  = row.querySelector(".time div")?.textContent || "--:--";
    const title = row.querySelector("a")?.textContent || "";
    const desc  = row.querySelector("small")?.textContent || "";
    const image = row.dataset.image || DEFAULT_EPG_IMAGE;

    const card = createCard({ time, title, desc, image });
    card.__row = { ts, len };

    if(now >= ts && now < ts + len){
      const percent = ((now - ts) / len) * 100;
      card.style.setProperty("--progress", percent + "%");
      card.classList.add("current");
    }

    overlay.appendChild(card);
  });
    // ako nema current emisije, probaj učitati jučerašnji fajl
    if(!overlay.querySelector(".epg-card.current") && !window.epgTriedYesterday){
      window.epgTriedYesterday = true;

      const channel = window.currentChannelList?.[window.currentIndex];
      const folder =
        document.getElementById("current-channel-epg")?.textContent?.trim()
        || channel?.epg_name;

      if(folder){
        const file = getFileForDay(-1);
        const s = document.createElement("script");
        s.src = `https://bosniana.org/assets/test/${folder}/${file}.js`;
        s.async = true;
        s.dataset.epg = "1";
        document.body.appendChild(s);
      }
    }

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
//    console.log(" Auto-scroll to current program");
    current.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
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

  let newCurrent = null;

  cards.forEach(card=>{
    const row = card.__row;
    if(!row) return;

    const { ts, len } = row;
    const end = ts + len;

    // trenutno aktivna emisija
    if(now >= ts && now < end){
      const p = ((now - ts) / len) * 100;
      card.style.setProperty("--progress", p + "%");
      newCurrent = card;
    } else {
      card.style.removeProperty("--progress");
      card.classList.remove("current");
    }
  });

  // ako smo našli novu "current" emisiju
  if(newCurrent && !newCurrent.classList.contains("current")){
    newCurrent.classList.add("current");
    newCurrent.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest"
    });
  }

}, 15000);
/* ================== AUTO RELOAD ON DAY CHANGE ================== */

let currentDayKey = getFileForDay(0);

setInterval(()=>{
  const newDayKey = getFileForDay(0);

  if(newDayKey !== currentDayKey){
    currentDayKey = newDayKey;

    // reset cache da dozvoli reload istog kanala
    window.lastEPGFolder = null;
    window.lastEPGChannel = null;

    loadEPGForCurrentChannel();
  }

}, 60000); // provjera svake minute
/* ================== INIT DEBUG ================== */
//console.log(" EPG.js loaded, ready for debugging");

