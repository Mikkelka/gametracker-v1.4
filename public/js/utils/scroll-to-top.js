// scroll-to-top.js
export function initScrollToTop() {
  const scrollToTopButton = document.createElement("button");
  scrollToTopButton.id = "scrollToTopButton";
  scrollToTopButton.innerHTML = "&#9650;"; // Unicode for an upward-pointing triangle
  scrollToTopButton.setAttribute("aria-label", "Scroll to top");
  document.body.appendChild(scrollToTopButton);

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 100) {
      scrollToTopButton.classList.add("show");
    } else {
      scrollToTopButton.classList.remove("show");
    }
  });

  scrollToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}
