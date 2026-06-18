// Apply the saved accent theme before first paint (no flash of default theme).
(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
