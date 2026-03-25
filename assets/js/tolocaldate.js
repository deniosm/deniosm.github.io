let allowScrollToCurrent = true;
const VISIBLE_COUNT = 8;
let visibleStart = 0;
let initialClickDone = false;
let visibleRows = [];

function appendRows(start, count, direction = "replace") {
  const slice = allRows.slice(start, start + count);

  if (direction === "replace") {
    scheduleEl.innerHTML = "";
    slice.forEach(r => scheduleEl.appendChild(r));
    scheduleWrapper.scrollTop = 0;
  }
  else if (direction === "down") {
    slice.forEach(r => scheduleEl.appendChild(r));
    const lastNew = slice[slice.length - 1];
    if (lastNew) lastNew.scrollIntoView({ block: "end", behavior: "smooth" });
  }
  else if (direction === "up") {
    slice.reverse().forEach(r => scheduleEl.insertBefore(r, scheduleEl.firstChild));
    const firstNew = slice[slice.length - 1];
    if (firstNew) firstNew.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}
/* ===== FUNKCIJA ZA LOKALNO VRIJEME +2h ===== */
function toLocalDate(ts){

  return new Date((ts + 1*3600) * 1000);
}
let loadIndex = 0;
let allRows = [];
/* ===== DAYS DATA ===== */
const months = [
  "01.", "02.", "03.", "04.", "05.", "06.",
  "07.", "08.", "09.", "10.", "11.", "12."
];

/* ===== DINAMIČKI EPG DAYS SA FOLDEROM IZ CURRENT CHANNEL ===== */
function generateEPGDays(backDays = 1, forwardDays = 5) {
  const months = [
    "januar","februar","mart","april","maj","juni",
    "juli","avgust","septembar","oktobar","novembar","decembar"
  ];

  const dayNames = [
    "Nedjelja","Ponedjeljak","Utorak",
    "Srijeda","Četvrtak","Petak","Subota"
  ];

  const today = new Date();
  const epgDays = [];

  const folderEl = document.getElementById("current-channel-epg");
  const folder = folderEl?.textContent?.trim() || "";

  for (let i = -backDays; i <= forwardDays; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();

    const label = `${y}-${String(m).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
    const name = dayNames[d.getDay()];
    const fileName = `${String(m).padStart(2,"0")}${String(dd).padStart(2,"0")}.js`;

    const file = folder ? `https://bosniana.org/assets/test/${folder}/${fileName}` : fileName;

    epgDays.push({ label, name, file });
  }

  return epgDays;
}


const epgDays = generateEPGDays(1, 5);
//console.log(epgDays);


const daysEl = document.getElementById("days");
const scheduleEl = document.getElementById("schedule-table");
const dateEl = document.getElementById("channel-date");
let lastDayKey = null;
let currentDay = 0;

/* ===== LOAD JS ===== */
function loadAllEPG(){
  loadIndex = 0;
  scheduleEl.innerHTML = "";
  allRows = [];
  loadNextDay();
}
function scrollToCurrentNow(){
  allowScrollToCurrent = true;
  markCurrent(allRows);
}
function loadNextDay(){
  if(loadIndex >= epgDays.length) return;

  const old = document.getElementById("epg-script");
  if(old) old.remove();

  const s = document.createElement("script");
  s.id = "epg-script";
  s.src = epgDays[loadIndex].file;
  document.body.appendChild(s);
}

/* ===== RENDER DAYS ===== */
const todayStr = new Date().toISOString().slice(0,10);

epgDays.forEach((d,i)=>{
  const div=document.createElement("div");
  div.className="day";
  if(d.label===todayStr){
    div.classList.add("today","active");
    currentDay=i;
  }

  const [y,m,dd]=d.label.split("-");
  div.innerHTML=`
    <div class="name">${d.name}</div>
    <div class="date">${dd}. ${months[m-1]}</div>
  `;

div.onclick = () => {
  document.querySelectorAll(".day").forEach(x => x.classList.remove("active"));
  div.classList.add("active");
  currentDay = i;

  let targetIndex = 0;

  if (d.label === todayStr) {
    const now = Math.floor(Date.now()/1000);
    targetIndex = allRows.findIndex(r=>{
      const ts = +r.dataset?.ts;
      const len = +r.dataset?.len;
      return ts && len && now >= ts && now < ts + len;
    });
    if(targetIndex === -1) targetIndex = 0;
  } else {

    targetIndex = allRows.findIndex(r => r.dataset?.date === d.label);
    if(targetIndex === -1) targetIndex = 0;
  }

  visibleStart = Math.max(0, targetIndex);
  appendRows(visibleStart, VISIBLE_COUNT);

  markCurrent(scheduleEl.children);
};

  daysEl.appendChild(div);
});
const scheduleWrapper = document.createElement("div");
scheduleWrapper.id = "schedule-wrapper";
scheduleWrapper.style.position = "relative";
scheduleWrapper.style.maxHeight = "600px";
scheduleWrapper.style.overflowY = "auto";

scheduleEl.parentNode.insertBefore(scheduleWrapper, scheduleEl);
scheduleWrapper.appendChild(scheduleEl);
/* ===== RENDER EPG ===== */
function renderEPG(data){
  const wrapper = document.createElement("div");
  wrapper.innerHTML = data.data.program;

  const rows = [...wrapper.children];

  rows.forEach(r=>{
    const ts = +r.dataset.ts;
    if(!ts) return;

    const d = toLocalDate(ts);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    // HEADER
    if(dayKey !== lastDayKey){
      const dayName = [
        "Nedjelja","Ponedjeljak","Utorak",
        "Srijeda","Četvrtak","Petak","Subota"
      ][d.getDay()];

      const header = document.createElement("div");
      header.className = "newday-header";
      header.dataset.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      header.innerHTML = `
        <h3 class="newday-header-h3"><span><i class="ri-calendar-2-line"></i></span>
          ${dayName}, <span>
          ${String(d.getDate()).padStart(2,"0")}.
          ${months[d.getMonth()]}
          ${d.getFullYear()}. </span>
        </h3>
      `;

      allRows.push(header);
      lastDayKey = dayKey;
    }

    allRows.push(r);
  });

  loadIndex++;
  if(loadIndex < epgDays.length){
    loadNextDay();
  } else {

    const now = Math.floor(Date.now()/1000);
    let currentIndex = allRows.findIndex(r=>{
      const ts = +r.dataset?.ts;
      const len = +r.dataset?.len;
      return ts && len && now >= ts && now < ts + len;
    });
    if(currentIndex === -1) currentIndex = 0;
    visibleStart = Math.max(0, currentIndex);
    appendRows(visibleStart, VISIBLE_COUNT);
    markCurrent(scheduleEl.children);
  }

    if (!initialClickDone) {
      initialClickDone = true;

      setTimeout(() => {
        const activeDay = document.querySelector(".day.active");
        if (activeDay) activeDay.click();
      }, 150);
    }
}
/* ===== CURRENT + TIMELAPSE ===== */
function markCurrent(rows){
  const now = Math.floor(Date.now()/1000);

  [...rows].forEach(r=>{
    r.classList.remove("current-program");
    r.style.removeProperty("--progress");
    r.style.removeProperty("--bgimg");
  });

  for(const r of rows){
    const ts = +r.dataset.ts;
    const len = +r.dataset.len;
    if(!ts || !len) continue;

    if(now >= ts && now < ts + len){
      r.classList.add("current-program");
      const passed = now - ts;
      const percent = Math.min(100, (passed / len) * 100);
      r.style.setProperty("--progress", percent + "%");
      if(r.dataset.image){
        r.style.setProperty("--bgimg", `url("${r.dataset.image}")`);
      } else {
        r.style.setProperty("--bgimg", "linear-gradient(135deg,#2a2f45,#151821)");
      }

      if(allowScrollToCurrent){
        r.scrollIntoView({ block:"start", behavior:"smooth" });
        allowScrollToCurrent = false;
      }

      break;
    }
  }
}
document.getElementById("scroll-up").onclick = () => {
  const newStart = Math.max(0, visibleStart - VISIBLE_COUNT);
  appendRows(newStart, VISIBLE_COUNT, "up");
  visibleStart = newStart;
  markCurrent(scheduleEl.children);
};

document.getElementById("scroll-down").onclick = () => {
  const newStart = Math.min(allRows.length - VISIBLE_COUNT, visibleStart + VISIBLE_COUNT);
  appendRows(newStart, VISIBLE_COUNT, "down");
  visibleStart = newStart;
  markCurrent(scheduleEl.children);
};

/* ===== JSONP CALLBACK ===== */
function tvprogrambsb49(obj){
  window.currentEPG=obj;
  renderEPG(obj);
}

/* ===== AUTO LOAD TODAY ===== */
loadAllEPG();

/* ===== TIMELAPSE UPDATE ===== */

setInterval(()=>{
  const rows = [...scheduleEl.children];
  if(rows.length) markCurrent(rows);
}, 15000); // svake minute
