"use client";

import * as React from "react";

/**
 * Sends the document height to the parent window (iframe auto-resize).
 * Parent (WordPress) should listen for `{ type: "maku-roi-height", height }`.
 * 
 * Ignores height changes from Radix UI portals (dialogs, popovers) to prevent
 * scroll jumps when these elements open/close.
 */
export function EmbedHeightMessenger() {
  React.useEffect(() => {
    // Only relevant when embedded in an iframe
    if (typeof window === "undefined") return;
    if (window.self === window.top) return;

    let raf = 0;
    let lastStableHeight = 0;
    let isPortalOpen = false;

    // Check if any Radix portal (dialog, popover) is currently open
    const checkPortalState = () => {
      const dialogOverlay = document.querySelector('[data-slot="dialog-overlay"]');
      const popoverContent = document.querySelector('[data-slot="popover-content"]');
      return !!(dialogOverlay || popoverContent);
    };

    const measureHeight = () => {
      // Measure only the main content, excluding portal elements
      const mainContent = document.querySelector('[role="main"]');
      if (mainContent && mainContent instanceof HTMLElement) {
        return Math.max(
          mainContent.scrollHeight ?? 0,
          mainContent.offsetHeight ?? 0,
          800 // Minimum height
        );
      }
      
      // Fallback to document measurement
      const docEl = document.documentElement;
      const body = document.body;
      return Math.max(
        docEl?.scrollHeight ?? 0,
        docEl?.offsetHeight ?? 0,
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0
      );
    };

    const postHeight = () => {
      const portalOpen = checkPortalState();
      
      // If portal just opened, store the current height and don't update
      if (portalOpen && !isPortalOpen) {
        isPortalOpen = true;
        return;
      }
      
      // If portal just closed, restore updates
      if (!portalOpen && isPortalOpen) {
        isPortalOpen = false;
      }
      
      // Don't send height updates while portals are open (prevents jumps)
      if (isPortalOpen) {
        return;
      }
      
      const height = measureHeight();
      
      // Only send if height changed significantly (more than 50px)
      // This prevents micro-updates that cause jitter
      if (Math.abs(height - lastStableHeight) > 50) {
        lastStableHeight = height;
        window.parent?.postMessage({ type: "maku-roi-height", height }, "*");
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(postHeight);
    };

    // Initial measurement
    schedule();

    // Use MutationObserver to detect portal changes
    const mo = new MutationObserver(() => {
      schedule();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const ro = new ResizeObserver(() => schedule());
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      ro.observe(mainContent);
    } else {
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }

    // Fallbacks for cases where observers don't fire
    window.addEventListener("load", schedule);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("load", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}

