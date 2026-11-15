// Section requested from another page; consumed once the target page mounts.
let queuedSection: string | null = null;

export function queueSectionScroll(id: string) {
  queuedSection = id;
}

export function takeQueuedSection() {
  const id = queuedSection;
  queuedSection = null;
  return id;
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return false;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  return true;
}
