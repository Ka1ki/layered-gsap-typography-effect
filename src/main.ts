import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Initialize smooth scrolling
const lenis = new Lenis({
  lerp: 0.09,
  smoothWheel: true,
});

// Sync Lenis scroll with ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);

// Update Lenis on each animation frame (time in milliseconds)
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// Disable lag smoothing to maintain smooth scroll even on frame drops
gsap.ticker.lagSmoothing(0);

// Track instances for cleanup on resize
let splitInstance: SplitText | null = null;
let scrollTriggerInstance: ScrollTrigger | null = null;

const initReveal = () => {
  // Clean up existing instances before creating new ones
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill();
    scrollTriggerInstance = null;
  }

  if (splitInstance) {
    splitInstance.revert();
    splitInstance = null;
  }

  // Select the text layer to animate
  const revealLayer = document.querySelector(".text-scroll-layer--reveal");

  if (!revealLayer) {
    console.error("Reveal layer not found");
    return;
  }

  // Split text into individual lines for sequential animation
  splitInstance = new SplitText(revealLayer, {
    type: "lines",
    linesClass: "text-scroll-reveal-line",
  });

  const lines = splitInstance.lines;
  const totalLines = lines.length;

  // Initialize clip-path to 100% (fully hidden)
  lines.forEach((line) => {
    gsap.set(line, { "--clip": "100%" });
  });

  // Trigger animation when element scrolls into view
  scrollTriggerInstance = ScrollTrigger.create({
    trigger: revealLayer,
    start: "top 90%",
    end: "top 20%",
    // markers: true, // Remove in production
    scrub: true,

    onUpdate: (self) => {
      // Reveal lines sequentially as user scrolls
      lines.forEach((line, index) => {
        const segment = 1 / totalLines;
        const start = index * segment;

        let progress = (self.progress - start) / segment;

        // Clamp progress to 0-1 range
        progress = Math.max(0, Math.min(1, progress));

        // Update clip-path CSS variable to reveal line
        gsap.set(line, {
          "--clip": `${100 - progress * 100}%`,
        });
      });
    },
  });
};

window.addEventListener("resize", initReveal);

const cleanup = () => {
  window.removeEventListener("resize", initReveal);

  // Kill ScrollTrigger instance
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill();
    scrollTriggerInstance = null;
  }

  // Revert SplitText (removes wrappers, restores original DOM)
  if (splitInstance) {
    splitInstance.revert();
    splitInstance = null;
  }

  // Stop Lenis smooth scroll
  lenis.destroy();
};

// Cleanup on page unload
window.addEventListener("beforeunload", cleanup);

// Cleanup on hot module replacement during development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup();
  });
}
// Wait for fonts to load before calculating line breaks
document.fonts.ready.then(() => {
  initReveal();
});
