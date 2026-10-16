"use client";

import { useLayoutEffect } from "react";
import { scrollToSection, takeQueuedSection } from "./sectionScroll";

// Plays the queued section scroll from the top of the page after navigation.
export const SectionScroll = () => {
  useLayoutEffect(() => {
    const id = takeQueuedSection();
    if (!id) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    scrollToSection(id);
  }, []);
  return null;
};
