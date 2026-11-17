"use client";

import { useEffect } from "react";

export function ClickBurst() {
  useEffect(() => {
    const flag = window as Window & { __svDeskBurst?: boolean };
    if (flag.__svDeskBurst) return;
    flag.__svDeskBurst = true;
    const greens = ["#bbf7d0", "#4ade80", "#16a34a", "#047857", "#d1fae5"];
    let last = 0;
    function onDown(event: Event) {
      const pointer = event as PointerEvent;
      if (pointer.button && pointer.button !== 0) return;
      const target = pointer.target as HTMLElement | null;
      if (!target?.closest?.(".desk")) return;
      if (target.closest("input, textarea, select, option")) return;
      const now = Date.now();
      if (now - last < 280) return;
      last = now;
      const x = pointer.clientX || window.innerWidth / 2;
      const y = pointer.clientY || window.innerHeight / 2;
      const hit = target.closest("a, button, label, summary, [role='button']");
      if (hit) {
        hit.classList.remove("sv-green-hit");
        void (hit as HTMLElement).offsetWidth;
        hit.classList.add("sv-green-hit");
        window.setTimeout(() => hit.classList.remove("sv-green-hit"), 900);
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const burst = document.createElement("span");
      burst.className = "sv-burst";
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;
      const core = document.createElement("span");
      core.className = "sv-burst-core";
      burst.appendChild(core);
      for (let index = 0; index < 18; index += 1) {
        const bit = document.createElement("i");
        const angle = (Math.PI * 2 * index) / 18;
        const dist = 46 + (index % 6) * 18;
        bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        bit.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
        bit.style.background = greens[index % greens.length]!;
        burst.appendChild(bit);
      }
      const splash = document.createElement("span");
      splash.className = "sv-splash";
      splash.style.left = `${x}px`;
      splash.style.top = `${y}px`;
      document.body.appendChild(splash);
      document.body.appendChild(burst);
      window.setTimeout(() => {
        splash.remove();
        burst.remove();
      }, 1000);
    }
    document.addEventListener("pointerdown", onDown, true);
  }, []);
  return null;
}
