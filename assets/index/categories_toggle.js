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

  // dugme toggle
  btn.addEventListener("click", (e) => {
    categories.classList.toggle("open");
    syncBodyClass();              // <-- DODANO
    e.stopPropagation(); // sprječava da klik na dugme odmah zatvori menu
  });

  // inicijalno postavi tekst na aktivnu kategoriju
  const updateButtonText = () => {
    const activeLi = categoryList.querySelector("li.active");
    btnText.textContent = activeLi ? activeLi.textContent.trim() : "Kanali";
  };

  updateButtonText();

  // kad korisnik klikne na kategoriju, zatvori sidebar i update button
  categoryList.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      categories.classList.remove("open");
      syncBodyClass();            // <-- DODANO

      // makni prethodni active
      categoryList.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      updateButtonText();
    });
  });

  // klik bilo gdje van menu-a zatvara categories ako je otvoren
  document.addEventListener("click", (e) => {
    if (categories.classList.contains("open") && !categories.contains(e.target) && !btn.contains(e.target)) {
      categories.classList.remove("open");
      syncBodyClass();            // <-- DODANO
    }
  });
})();
