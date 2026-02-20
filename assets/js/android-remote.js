(function () {
  let categoriesOpen = false;
  let settingsOpen = false;
  function click(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  function handleCategories(e) {
    if (!categoriesOpen) return false;

    const items = document.querySelectorAll("#categories li");
    if (!items.length) return false;

    let index = Array.from(items).findIndex(li =>
      li.classList.contains("active")
    );
    if (index === -1) index = 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[index].classList.remove("active");
      index = (index + 1) % items.length;
      items[index].classList.add("active");
      items[index].scrollIntoView({ block: "nearest" });
      return true;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      items[index].classList.remove("active");
      index = (index - 1 + items.length) % items.length;
      items[index].classList.add("active");
      items[index].scrollIntoView({ block: "nearest" });
      return true;
    }

    if (e.key === "Enter" || e.key === "OK") {
      e.preventDefault();
      items[index].click();
      categoriesOpen = false;
      return true;
    }

    return false;
  }
    function handleSettings(e) {
        if (!settingsOpen) return false;

        const items = document.querySelectorAll("#settings-dropdown li");
        if (!items.length) return false;

        let index = Array.from(items).findIndex(li =>
            li.classList.contains("active")
        );
        if (index === -1) index = 0;

        // ArrowDown
        if (e.key === "ArrowDown") {
            e.preventDefault();
            items[index].classList.remove("active");
            index = (index + 1) % items.length;
            items[index].classList.add("active");
            items[index].scrollIntoView({ block: "nearest" });
            return true;
        }

        // ArrowUp
        if (e.key === "ArrowUp") {
            e.preventDefault();
            items[index].classList.remove("active");
            index = (index - 1 + items.length) % items.length;
            items[index].classList.add("active");
            items[index].scrollIntoView({ block: "nearest" });
            return true;
        }

        if (e.key === "Enter" || e.key === "OK") {
            e.preventDefault();
            items[index].click();
            settingsOpen = false;

            // ukloni active s item-settings
            const settingsBar = document.getElementById("item-settings");
            if(settingsBar) settingsBar.classList.remove("active");

            return true;
        }


        if (e.key === "Backspace" || e.key === "Escape") {
            e.preventDefault();
            settingsOpen = false;
            const dropdown = document.getElementById("settings-dropdown");
            if(dropdown) dropdown.classList.add("hidden");

            // ukloni active s item-settings
            const settingsBar = document.getElementById("item-settings");
            if(settingsBar) settingsBar.classList.remove("active");

            return true;
        }


        return false;
    }

    function handleLogoutOverlay(e) {
        const overlay = document.getElementById("logout-overlay");
        if (!overlay || overlay.classList.contains("hidden")) return false;

        const items = Array.from(overlay.querySelectorAll("#logout-actions button"));
        if (!items.length) return false;

        // pronađi trenutno označeno dugme
        let index = items.findIndex(btn => btn.classList.contains("active"));
        if (index === -1) index = 0;
        items.forEach(btn => btn.classList.remove("active"));
        items[index].classList.add("active");

        if (e.key === "ArrowDown") {
            e.preventDefault();
            items[index].classList.remove("active");
            index = (index + 1) % items.length;
            items[index].classList.add("active");
            items[index].scrollIntoView({ block: "nearest" });
            return true;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            items[index].classList.remove("active");
            index = (index - 1 + items.length) % items.length;
            items[index].classList.add("active");
            items[index].scrollIntoView({ block: "nearest" });
            return true;
        }

        if (e.key === "Enter" || e.key === "OK") {
            e.preventDefault();
            items[index].click();  // aktivira odabrano dugme
            return true;
        }

        if (e.key === "Escape" || e.key === "Backspace" || e.key === "Back") {
            e.preventDefault();
            overlay.classList.add("hidden"); // zatvori modal
            return true;
        }

        return false;
    }


  document.addEventListener("keydown", function (e) {

    /* categories hvataju tipke SAMO dok su otvorene */
    if (handleCategories(e)) return;
    if (handleSettings(e)) return;
    if (handleLogoutOverlay(e)) return;
    switch (e.key) {

      // Prethodni kanal
      case "ArrowLeft":
      case "MediaTrackPrevious":
        e.preventDefault();
        click("prevChannelBtn");
        break;

      // Sljedeći kanal
      case "ArrowRight":
      case "MediaTrackNext":
        e.preventDefault();
        click("nextChannelBtn");
        break;

      // Play/Pause
      case " ":
      case "MediaPlayPause":
        e.preventDefault();
        click("play-pause-btn");
        break;

      // Categories toggle
      case "ContextMenu":
      case "Menu":
      case "Delete":
        e.preventDefault();
        categoriesOpen = !categoriesOpen;
        click("categories-toggle");
        break;

      // Sidebar
      case "ArrowUp":
        e.preventDefault();
        click("sidebar-toggle");
        break;

      // EPG
      case "Insert":
      case "Info":
        e.preventDefault();
        click("epgBtn");
        break;
      // Volume control
      case "VolumeUp":
      case "PageUp":
        e.preventDefault();
        const video1 = document.getElementById("video");
        if(video1) {
            video1.volume = Math.min(video1.volume + 0.1, 1);
        }
        break;

      case "VolumeDown":
      case "PageDown":
        e.preventDefault();
        const video2 = document.getElementById("video");
        if(video2) {
            video2.volume = Math.max(video2.volume - 0.1, 0);
        }
        break;

    case "VolumeMute":
    case "m":   // tastatura 'm' za mute
        e.preventDefault();
        click("soundBtnIcon");
        break;
    // Bar-item sigurne tipke
    case "Home":
    case "h":   // tastatura
        e.preventDefault();
        click("item-tv");
        break;

    case "Settings":
    case "s":
        e.preventDefault();
        click("item-settings");
        settingsOpen = true;

        // dodaj active klasu samo na item-settings dok je dropdown otvoren
        const settingsBar = document.getElementById("item-settings");
        if(settingsBar) settingsBar.classList.add("active");

        // inicijalno označi prvu stavku u dropdownu
        const items = document.querySelectorAll("#settings-dropdown li");
        items.forEach(li => li.classList.remove("active"));
        if(items.length) items[0].classList.add("active");

        break;

    case "Red":
    case "r":   // tastatura
        e.preventDefault();
        click("item-filmovi");
        break;

    case "Green":
    case "g":   // tastatura
        e.preventDefault();
        click("item-program");
        break;

    case "Blue":
    case "b":   // tastatura
        e.preventDefault();
        click("item-radio");
        break;
      // Back / Close
      case "Backspace":
      case "Escape":
      case "Back":
        e.preventDefault();
        categoriesOpen = false;

        if (!document.getElementById("page-overlay")?.classList.contains("hidden")) {
          click("page-overlay-close");
          return;
        }

        const settings = document.getElementById("settings-dropdown");
        if (settings && !settings.classList.contains("hidden")) {
          settings.classList.add("hidden");
          return;
        }

        click("closeBtn");
        break;

      // Enter / OK – globalno, bez default akcije
      case "Enter":
      case "OK":
        break;
    }
  });
})();

