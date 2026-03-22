const DEFAULT_EPG_IMAGE = "https://bosniana.org/assets/dtvicons/no-epg.jpg";
const SCROLL_STEP = 160;
const INITIAL_EPG_VISIBLE = 12;
/* ================== EPG STATE ================== */
window.epgDayOffset = 0;
window.epgProgramBuffer = [];
window.epgCurrentFound = false;
window.epgFailedAttempts = 0; // brojač neuspjelih učitavanja
window.epgFailedMax = 3;
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
  window.epgDayOffset = 0;
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
    window.epgDayOffset = 0;
    window.epgProgramBuffer = [];
    window.epgRenderIndex = 0
    window.lastCurrent = null;
    window.epgCurrentFound = false;
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

  for(let i=0;i<10;i++){
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

  rows.forEach(row=>{
    const ts  = +row.dataset.ts;
    const len = +row.dataset.len;
    if(!ts || !len) return;

    const time  = row.querySelector(".time div")?.textContent || "--:--";
    const title = row.querySelector("a")?.textContent || "";
    const desc  = row.querySelector("small")?.textContent || "";
    const image = row.dataset.image || DEFAULT_EPG_IMAGE;

    window.epgProgramBuffer.push({
      ts, len, time, title, desc, image
    });
  });

  /* ===== SORT po vremenu ===== */
  window.epgProgramBuffer.sort((a,b)=>a.ts-b.ts);
  // ukloni duplikate po timestampu
  window.epgProgramBuffer = window.epgProgramBuffer.filter(
      (p, i, arr) => i === 0 || p.ts !== arr[i-1].ts
  );
/* ===== nađi CURRENT ===== */

let startIndex = window.epgProgramBuffer.findIndex(p=>{
  return now >= p.ts && now < p.ts + p.len;
});

/* ako nema current → pokušaj jučer (postojeći backend kod) */

    if(startIndex === -1 && !window.epgTriedYesterday){

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
        return;
      }
    }

    /* fallback */
    if(startIndex < 0) startIndex = 0;

  /* ===== uzmi current + dalje ===== */
  const visiblePrograms = window.epgProgramBuffer.slice(startIndex);

  /* ===== ako nema 10 emisija učitaj sljedeći dan ===== */
  if(visiblePrograms.length < 10 && window.epgDayOffset < 3){

    window.epgDayOffset++;

    const channel = window.currentChannelList?.[window.currentIndex];
    const folder =
      document.getElementById("current-channel-epg")?.textContent?.trim()
      || channel?.epg_name;

    if(folder){
      const file = getFileForDay(window.epgDayOffset);

      const s = document.createElement("script");
      s.src = `https://bosniana.org/assets/test/${folder}/${file}.js`;
      s.async = true;
      s.dataset.epg = "1";

      document.body.appendChild(s);
      return;
    }
  }

  /* ===== render ===== */

  overlay.innerHTML = "";

    const initialPrograms = visiblePrograms.slice(0, INITIAL_EPG_VISIBLE);

    initialPrograms.forEach(p=>{
const card = createCard(p);
card.__row = { ts:p.ts, len:p.len };
card.dataset.ts = p.ts;

      if(now >= p.ts && now < p.ts + p.len){
        const percent = ((now - p.ts) / p.len) * 100;
        card.style.setProperty("--progress", percent + "%");
        card.classList.add("current");
      }

      overlay.appendChild(card);
    });
    window.epgRenderIndex = INITIAL_EPG_VISIBLE;

  autoScrollToCurrent();
  updatePlayerTimeline();
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
      appendNextProgram();  // dodaj jednu emisiju po potrebi
    }
});

function cleanupOldPrograms(){

  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  const cards = [...overlay.querySelectorAll(".epg-card")];
  const now = Math.floor(Date.now()/1000);

  let currentFound = false;

  cards.forEach(card=>{
    const row = card.__row;
    if(!row) return;

    if(now >= row.ts && now < row.ts + row.len){
      currentFound = true;
    }

    if(!currentFound){
      card.remove(); // briše samo one prije current
    }
  });

}
function updatePlayerTimeline(){
  const cards = [...document.querySelectorAll(".epg-card")];
  const now = Math.floor(Date.now()/1000);

  let newCurrent = null;
  let nextStart = null;

for (const [i, card] of cards.entries()) {
  const row = card.__row;
  if (!row) continue;

  const { ts, len } = row;
  const end = ts + len;

  if(now >= ts && now < end){
    card.style.setProperty("--progress", ((now - ts) / len) * 100 + "%");
    card.classList.add("current");
    newCurrent = card;

    const nextCard = cards[i+1];
    if(nextCard?.__row) nextStart = nextCard.__row.ts;

    break;
  } else {
    card.classList.remove("current");
    card.style.removeProperty("--progress");
  }
}

  const playerProgress = document.getElementById("player-timeline-progress");
    const startSpan = document.getElementById("player-timeline-start");
    const endSpan   = document.getElementById("player-timeline-end");

    if(playerProgress && startSpan && endSpan){
        if(newCurrent){
            const { ts, len } = newCurrent.__row;
            const p = ((now - ts) / len) * 100;
            playerProgress.style.width = p + "%";

            const start = new Date(ts * 1000);
            const end   = nextStart ? new Date(nextStart * 1000) : new Date((ts + len) * 1000);

            startSpan.textContent = newCurrent.querySelector(".epg-time")?.textContent || "--:--";
            endSpan.textContent   = newCurrent.nextElementSibling?.querySelector(".epg-time")?.textContent || "--:--";
        } else {
            // fallback ako nema current
            playerProgress.style.width = "0%";
            startSpan.textContent = "--:--";
            endSpan.textContent   = "--:--";
            window.lastCurrent = null;
        }
    }
    const channelBox = document.getElementById("control-bar");
    if(channelBox){
        let epgDiv = channelBox.querySelector(".channel-epg-now");
        if(!epgDiv){
            epgDiv = document.createElement("div");
            epgDiv.className = "channel-epg-now";
            channelBox.appendChild(epgDiv);
        }

        if(newCurrent){
            const time  = newCurrent.querySelector(".epg-time")?.textContent || "";
            const title = newCurrent.querySelector(".epg-title")?.textContent || "";
            epgDiv.textContent = title + " "; // + time
        } else {
            epgDiv.textContent = "EPG nedostupan";
        }
    }
    // dodaj novu logiku: appendNextProgram samo ako current kartica promijenjena
    if(newCurrent !== window.lastCurrent){
        window.lastCurrent = newCurrent;
        autoScrollToCurrent();
        appendNextProgram();
    }
    autoScrollToCurrent();
    ensureFuturePrograms();
    cleanupOldPrograms();
}
function ensureFuturePrograms(){

  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  const cards = overlay.querySelectorAll(".epg-card");

  if(cards.length >= 10) return;

  const channel = window.currentChannelList?.[window.currentIndex];
  const folder =
    document.getElementById("current-channel-epg")?.textContent?.trim()
    || channel?.epg_name;

  if(!folder) return;
    const file = getFileForDay(window.epgDayOffset || 0);

    if(document.querySelector(`script[src*="${file}.js"]`)) return;

    const s = document.createElement("script");
  s.src = `https://bosniana.org/assets/test/${folder}/${file}.js`;
  s.async = true;
  s.dataset.epg = "1";

  s.onerror = () => {
    window.epgFailedAttempts++;
    if(window.epgFailedAttempts >= window.epgFailedMax){
      // ubaci fallback kartice ako 3 puta nije uspjelo
      const fallbackCount = 10 - cards.length;
      for(let i=0;i<fallbackCount;i++){
        const card = createCard({
          time: "--:--",
          title: i === 0 ? channel?.name || "Nepoznat kanal" : "DeniTV Global",
          desc: "EPG nedostupan",
          image: DEFAULT_EPG_IMAGE
        });
        overlay.appendChild(card);
      }
    } else {
      // pokušaj opet (isti dan ili idući file)
      ensureFuturePrograms();
    }
  }

  document.body.appendChild(s);
}
function appendNextProgram(){
  const overlay = document.querySelector(".epg-overlay");
  if(!overlay) return;

  const next = window.epgProgramBuffer[window.epgRenderIndex];
  if(!next){
    ensureFuturePrograms(); // ako nema više u bufferu, učitaj sljedeći dan
    return;
  }

    // zaštita od duplikata
    if(overlay.querySelector(`[data-ts="${next.ts}"]`)) return;

    const card = createCard(next);
    card.__row = { ts: next.ts, len: next.len };
    card.dataset.ts = next.ts;

  overlay.appendChild(card);
  window.epgRenderIndex++;
}
/* ================== AUTO REFRESH PROGRESS ================== */
setInterval(updatePlayerTimeline, 5000);
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
