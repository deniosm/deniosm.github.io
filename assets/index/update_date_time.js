function updateDateTime() {
  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");
  if (!timeEl || !dateEl) return;

  const now = new Date();

  // Sat po BiH vremenu
  const timeFormatter = new Intl.DateTimeFormat("bs-BA", {
    timeZone: "Europe/Sarajevo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const time = timeFormatter.format(now);
  timeEl.textContent = time;

  // Datum po BiH vremenu, ali uvijek sa bosanskim danima
  const days = [
    "Ned",
    "Pon",
    "Uto",
    "Sri",
    "Čet",
    "Pet",
    "Sub"
  ];

  const formatter = new Intl.DateTimeFormat("bs-BA", {
    timeZone: "Europe/Sarajevo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const parts = formatter.formatToParts(now);

  const dd = parts.find(p => p.type === "day").value;
  const mm = parts.find(p => p.type === "month").value;
  const year = parts.find(p => p.type === "year").value;

  const dayName = days[now.getDay()]; // ime dana po Bosanskom

  dateEl.textContent = `${dayName}, ${dd}.${mm}.${year}`;
}

// pokreni odmah
updateDateTime();

// osvježavanje svake minute
setInterval(updateDateTime, 60 * 1000);
