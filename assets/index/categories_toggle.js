(function () {
  const btn = document.getElementById("categories-toggle");
  const btnText = btn.querySelector(".text");
  const categories = document.getElementById("categories");
  const categoryList = document.getElementById("category-list");

  if (!btn || !btnText || !categories || !categoryList) return;

  /* helper – SINHRONIZUJE body klasu */
  const syncBodyClass = () => {
    document.body.classList.toggle(
      "categories-open",
      categories.classList.contains("open")
    );
  };

  /* 🔹 AUTOMATSKI POSTAVI data-category NA SVE LI */
  categoryList.querySelectorAll("li").forEach(li => {
    const text = li.textContent.trim();
    if (text && getComputedStyle(li).pointerEvents !== "none") {
      li.dataset.category = text;
    }
  });

  /* 🔹 helper – update dugmeta + sigurni active */
  const updateButtonText = () => {
    let activeLi = categoryList.querySelector("li.active");

    // ako nema active → postavi prvi validan
    if (!activeLi) {
      const first = Array.from(categoryList.querySelectorAll("li"))
        .find(li => li.dataset.category);
      if (first) {
        first.classList.add("active");
        activeLi = first;
      }
    }

    if (activeLi) {
      btnText.textContent = activeLi.dataset.category || activeLi.textContent.trim();
    }
  };

  /* 🔹 dugme toggle */
  btn.addEventListener("click", (e) => {
    categories.classList.toggle("open");
    syncBodyClass();

    // ⬅ svaki put kad otvoriš → sync active (VAŽNO za tvoj bug)
    updateButtonText();

    e.stopPropagation();
  });

  updateButtonText();

  /* 🔹 klik na kategoriju */
  categoryList.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", (e) => {

      if (!li.dataset.category && !li.textContent.trim()) return;

      if (li.classList.contains("active")) {
        e.stopPropagation();
        return;
      }

    const selected = li.dataset.category || li.textContent.trim();

      // zatvori menu
      categories.classList.remove("open");
      syncBodyClass();

      // UI active
      categoryList.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      updateButtonText();

      if (window.renderChannels) {
        window.renderChannels(selected);
      }
    });
  });

  /* 🔹 klik vani zatvara */
  document.addEventListener("click", (e) => {
    if (
      categories.classList.contains("open") &&
      !categories.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      categories.classList.remove("open");
      syncBodyClass();
    }
  });

})();
