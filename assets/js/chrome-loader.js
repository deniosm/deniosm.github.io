window.addEventListener("load", () => {
  // Chrome sometimes never ends loading when video streams
  if (document.readyState !== "complete") {
    document.body.classList.add("loaded");
  }
});
