(function () {
  let categoriesOpen = false;
  let settingsOpen = false;

  function click(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  // Sinhronizacija categoriesOpen sa UI klasom
  const syncCategoriesOpen = () => {
    const categoriesBtn = document.getElementById("categories-toggle");
    categoriesOpen = categoriesBtn?.classList.contains("open") || false;
  };

function handleCategories(e) {
  const categoriesEl = document.getElementById("categories");
  const isOpen = categoriesEl && categoriesEl.classList.contains("open");

  if (!isOpen) return false;

  stopUiAutoClose?.();

  const items = Array.from(document.querySelectorAll("#category-list li"))
    .filter(li => getComputedStyle(li).pointerEvents !== "none");

  if (!items.length) return false;

  let index = items.findIndex(li => li.classList.contains("active"));
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

      const selected = items[index];

      items.forEach(li => li.classList.remove("active"));
      selected.classList.add("active");

      const category = selected.textContent.trim();

      if (window.renderChannels) {
        window.renderChannels(category);
      }

      click("categories-toggle");
      tryStartAutoClose?.();

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
      settingsOpen = false;
      const settingsBar = document.getElementById("item-settings");
      if(settingsBar) settingsBar.classList.remove("active");
      return true;
    }

    if (e.key === "Backspace" || e.key === "Escape") {
      e.preventDefault();
      settingsOpen = false;
      const dropdown = document.getElementById("settings-dropdown");
      if(dropdown) dropdown.classList.add("hidden");
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
      items[index].click();
      return true;
    }

    if (e.key === "Escape" || e.key === "Backspace" || e.key === "Back") {
      e.preventDefault();
      overlay.classList.add("hidden");
      return true;
    }

    return false;
  }

  document.addEventListener("keydown", function (e) {
    syncCategoriesOpen(); // svaki keydown sinhronizira stanje

    if (handleCategories(e)) return;
    if (handleSettings(e)) return;
    if (handleLogoutOverlay(e)) return;

    const uiBlocked = playerContainer?.classList.contains('blockklick') || fadeEl?.classList.contains('active');

    switch (e.key) {
      // Prethodni kanal
      case "ArrowLeft":
      case "MediaTrackPrevious":
        e.preventDefault();
        if (!sidebar?.classList.contains('open')) sidebar?.classList.add('open');
        if (!controlBar?.classList.contains('open')) controlBar?.classList.add('open');
        resetUiAutoClose();
        if (!uiBlocked) click("prevChannelBtn");
        break;

      // Sljedeći kanal
      case "ArrowRight":
      case "MediaTrackNext":
        e.preventDefault();
        if (!sidebar?.classList.contains('open')) sidebar?.classList.add('open');
        if (!controlBar?.classList.contains('open')) controlBar?.classList.add('open');
        resetUiAutoClose();
        if (!uiBlocked) click("nextChannelBtn");
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
        if (!sidebar?.classList.contains('open')) sidebar?.classList.add('open');
        if (!controlBar?.classList.contains('open')) controlBar?.classList.add('open');
        resetUiAutoClose();
        click("categories-toggle");
        syncCategoriesOpen();
        break;

      // Sidebar
      case "ArrowUp":
        e.preventDefault();
        if (!sidebar?.classList.contains('open')) sidebar?.classList.add('open');
        if (!controlBar?.classList.contains('open')) controlBar?.classList.add('open');
        resetUiAutoClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!sidebar?.classList.contains('open')) sidebar?.classList.add('open');
        if (!controlBar?.classList.contains('open')) controlBar?.classList.add('open');
        resetUiAutoClose();
        break;
      // Ostale tipke ostaju iste...
      case "Insert":
      case "Info":
        e.preventDefault();
        click("epgBtn");
        break;

      case "VolumeUp":
      case "PageUp":
        e.preventDefault();
        const video1 = document.getElementById("video");
        if(video1) video1.volume = Math.min(video1.volume + 0.1, 1);
        break;

      case "VolumeDown":
      case "PageDown":
        e.preventDefault();
        const video2 = document.getElementById("video");
        if(video2) video2.volume = Math.max(video2.volume - 0.1, 0);
        break;

      case "VolumeMute":
      case "m":
        e.preventDefault();
        click("soundBtnIcon");
        break;

      case "Home":
      case "h":
        e.preventDefault();
        click("item-tv");
        break;

      case "Settings":
      case "s":
        e.preventDefault();
        click("item-settings");
        settingsOpen = true;
        const settingsBar = document.getElementById("item-settings");
        if(settingsBar) settingsBar.classList.add("active");
        const items = document.querySelectorAll("#settings-dropdown li");
        items.forEach(li => li.classList.remove("active"));
        if(items.length) items[0].classList.add("active");
        break;

      case "Red":
      case "r":
        e.preventDefault();
        click("item-filmovi");
        break;

      case "Green":
      case "g":
        e.preventDefault();
        click("item-program");
        break;

      case "Blue":
      case "b":
        e.preventDefault();
        click("item-radio");
        break;

      case "Backspace":
      case "Escape":
      case "Back":
        e.preventDefault();

          const categoriesEl = document.getElementById("categories");
          if (categoriesEl?.classList.contains("open")) {
            click("categories-toggle");   // zatvori categories
            tryStartAutoClose?.();        // ⬅ vrati auto close
            return;
          }
        syncCategoriesOpen(); // update prije zatvaranja
        click("closeBtn");
        closeUI();
        break;
    }
  });
})();
