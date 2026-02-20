let allowScrollToCurrent = true; // scroll samo prvi put

/* ===== FUNKCIJA ZA LOKALNO VRIJEME +2h ===== */
function toLocalDate(ts){

  return new Date((ts + 1*3600) * 1000);
}
let loadIndex = 0;
let allRows = [];
/* ===== DAYS DATA ===== */
const months = [
  "januar","februar","mart","april","maj","juni",
  "juli","avgust","septembar","oktobar","novembar","decembar"
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

  // Dohvati ime foldera iz div-a
  const folderEl = document.getElementById("current-channel-epg");
  const folder = folderEl?.textContent?.trim() || ""; // fallback na prazan string

  for (let i = -backDays; i <= forwardDays; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();

    const label = `${y}-${String(m).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
    const name = dayNames[d.getDay()];
    const fileName = `${String(m).padStart(2,"0")}${String(dd).padStart(2,"0")}.js`;

    // Dodaj folder ispred imena fajla
    const file = folder ? `https://bosniana.org/assets/test/${folder}/${fileName}` : fileName;

    epgDays.push({ label, name, file });
  }

  return epgDays;
}

// Kreiranje epgDays automatski
const epgDays = generateEPGDays(1, 5);
console.log(epgDays); // provjeriti ispis u konzoli


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

	  // reload od izabranog dana
	  loadIndex = i;
	  lastDayKey = null;
	  scheduleEl.innerHTML = "";
	  loadNextDay();

	  // scroll na taj dan
	  setTimeout(() => {
		const target = document.querySelector(`.newday-header[data-date="${d.label}"]`);
		if (target) {
		  target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	  }, 200);

	  // scroll u days baru
	  div.scrollIntoView({
		behavior: "smooth",
		inline: "center",
		block: "nearest"
	  });
	};


  daysEl.appendChild(div);
});

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

    /* ===== UBACI HEADER TAČNO U 00:00 ===== */
    if(dayKey !== lastDayKey){
      const dayName = [
        "Nedjelja","Ponedjeljak","Utorak",
        "Srijeda","Četvrtak","Petak","Subota"
      ][d.getDay()];

      const header = document.createElement("div");
      header.className = "newday-header";
      header.innerHTML = `
        <h3 class="newday-header-h3"><span><i class="ri-calendar-2-line"></i></span>
          ${dayName}, <span>
          ${String(d.getDate()).padStart(2,"0")}.
          ${months[d.getMonth()]}
          ${d.getFullYear()}. </span>
        </h3>
      `;

      scheduleEl.appendChild(header);
      lastDayKey = dayKey; // ažuriramo globalno
    }

    scheduleEl.appendChild(r);
    allRows.push(r);
  });

  /* ===== LOAD NEXT DAY FILE ===== */
  loadIndex++;
  loadNextDay();

  /* ===== OZNAČI TRENUTNI PROGRAM ===== */
  markCurrent(allRows);
}
/* ===== CURRENT + TIMELAPSE ===== */
function markCurrent(rows){
  const now = Math.floor(Date.now()/1000);

  rows.forEach(r=>{
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

      // scroll samo ako je dozvoljeno (prvi put)
      if(allowScrollToCurrent){
        r.scrollIntoView({ block:"start", behavior:"smooth" });
        allowScrollToCurrent = false; // više ne scrolla automatski
      }

      break;
    }
  }
}

/* ===== FUNKCIJA ZA RENDER U EPG OVERLAY ===== */
function renderEPGOverlay(data) {
  const overlay = document.querySelector(".epg-overlay");
  if (!overlay) return;

  overlay.innerHTML = ""; // očistimo prethodne kartice

  const programs = data.data.program; // raw HTML iz JSONP
  const wrapper = document.createElement("div");
  wrapper.innerHTML = programs;
  const rows = [...wrapper.children];

  const now = Math.floor(Date.now() / 1000);

  rows.forEach((r, index) => {
    const ts = +r.dataset.ts;
    const len = +r.dataset.len;
    if (!ts || !len) return;

    // Kreiramo karticu
    const card = document.createElement("div");
    card.className = "epg-card";

    // Background slika ili default gradijent
    if (r.dataset.image) {
      card.style.backgroundImage = `url("${r.dataset.image}")`;
    } else {
      card.style.backgroundImage = "linear-gradient(135deg,#2a2f45,#151821)";
    }

    // Info
    const info = document.createElement("div");
    info.className = "info";

    // Naslov
    const title = document.createElement("div");
    title.className = "epg-title";
    title.textContent = r.querySelector(".title")?.textContent || "";

    // Vrijeme
    const timeDiv = document.createElement("div");
    timeDiv.className = "epg-time";

    const d = toLocalDate(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    timeDiv.textContent = `${hh}:${mm}`;

    // Opis
    const desc = document.createElement("div");
    desc.className = "epg-desc";
    desc.textContent = r.querySelector(".desc")?.textContent || "";

    info.appendChild(title);
    info.appendChild(timeDiv);
    info.appendChild(desc);
    card.appendChild(info);

    // Timeline progres
    if (now >= ts && now < ts + len) {
      const passed = now - ts;
      const percent = Math.min(100, (passed / len) * 100);
      card.style.setProperty("--progress", percent + "%");
      card.classList.add("current-program");
    }

    overlay.appendChild(card);
  });
}


/* ===== CALLBACK za JSONP ===== */
function tvprogrambsb49(obj) {
  window.currentEPG = obj;
  renderEPGOverlay(obj);
}

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
