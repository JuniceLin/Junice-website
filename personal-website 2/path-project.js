// Keep links back from project pages in the requested portfolio category.
(() => {
  const category = new URLSearchParams(window.location.search).get("category");
  if (["vibe", "visual", "uiux"].includes(category) && typeof setPortfolioCategory === "function") {
    setPortfolioCategory(category);
  }
})();
