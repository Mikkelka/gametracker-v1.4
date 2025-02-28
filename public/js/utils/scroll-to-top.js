// scroll-to-top.js
export function initScrollToTop() {
  const scrollToTopButton = document.createElement("button");
  scrollToTopButton.id = "scrollToTopButton";
  scrollToTopButton.innerHTML = ""; // Tom, da vi bruger CSS ::before
  scrollToTopButton.setAttribute("aria-label", "Scroll to top");
  document.body.appendChild(scrollToTopButton);

  // Højere tærskel for visning, så knappen forsvinder tidligere
  const SCROLL_THRESHOLD = 300; // Øget fra 200 til 300
  
  // Track om vi er i scroll-to-top tilstand
  let isScrollingToTop = false;

  // Opdateret scroll event handler
  const handleScroll = () => {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Hvis vi scroller til toppen, eller er tæt på toppen
    if (isScrollingToTop || scrollPosition < SCROLL_THRESHOLD) {
      scrollToTopButton.classList.remove("show");
    } else {
      scrollToTopButton.classList.add("show");
    }
  };

  // Lyt efter scroll events
  window.addEventListener("scroll", handleScroll);
  
  // Tjek position ved page load
  window.addEventListener("load", () => {
    handleScroll();
    // Ekstra sikkerhed - force skjul ved page load
    setTimeout(() => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      if (scrollPosition < SCROLL_THRESHOLD) {
        scrollToTopButton.classList.remove("show");
      }
    }, 500);
  });
  
  // Lyt efter resize events
  window.addEventListener("resize", handleScroll);

  // Scroll-to-top funktion med forbedret håndtering
  scrollToTopButton.addEventListener("click", () => {
    // Marker at vi er i scroll-to-top tilstand
    isScrollingToTop = true;
    
    // Fjern knappen med det samme
    scrollToTopButton.classList.remove("show");
    
    // Scroll til toppen
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    
    // Fortsæt med at fjerne knappen i lidt tid efter klik
    // Dette håndterer edge cases hvor scrolling tager tid
    setTimeout(() => {
      scrollToTopButton.classList.remove("show");
      
      // Nulstil flag efter en passende ventetid
      setTimeout(() => {
        isScrollingToTop = false;
        handleScroll(); // Tjek igen for at sikre korrekt tilstand
      }, 1000);
    }, 100);
  });
}