import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-paper focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="sv-canvas">
        <Script id="sv-green-burst" strategy="afterInteractive">{`
          (function () {
            if (window.__svBurst) return;
            window.__svBurst = true;
            var greens = ["#bbf7d0", "#4ade80", "#16a34a", "#047857", "#d1fae5"];
            var last = 0;
            function onDown(event) {
              if (event.button && event.button !== 0) return;
              var target = event.target;
              if (!target || !target.closest || !target.closest(".sv-canvas")) return;
              if (target.closest("input, textarea, select, option")) return;
              var now = Date.now();
              if (now - last < 280) return;
              last = now;
              var x = event.clientX || window.innerWidth / 2;
              var y = event.clientY || window.innerHeight / 2;
              var hit = target.closest("a, button, label, summary, [role='button'], .sv-color-card");
              if (hit) {
                hit.classList.remove("sv-green-hit");
                void hit.offsetWidth;
                hit.classList.add("sv-green-hit");
                setTimeout(function () { hit.classList.remove("sv-green-hit"); }, 900);
              }
              if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
              var burst = document.createElement("span");
              burst.className = "sv-burst";
              burst.style.left = x + "px";
              burst.style.top = y + "px";
              var core = document.createElement("span");
              core.className = "sv-burst-core";
              burst.appendChild(core);
              for (var index = 0; index < 18; index += 1) {
                var bit = document.createElement("i");
                var angle = (Math.PI * 2 * index) / 18;
                var dist = 46 + (index % 6) * 18;
                bit.style.setProperty("--dx", Math.cos(angle) * dist + "px");
                bit.style.setProperty("--dy", Math.sin(angle) * dist + "px");
                bit.style.background = greens[index % greens.length];
                burst.appendChild(bit);
              }
              var splash = document.createElement("span");
              splash.className = "sv-splash";
              splash.style.left = x + "px";
              splash.style.top = y + "px";
              document.body.appendChild(splash);
              document.body.appendChild(burst);
              setTimeout(function () { splash.remove(); burst.remove(); }, 1000);
            }
            document.addEventListener("pointerdown", onDown, true);
            document.addEventListener("click", onDown, true);
          })();
        `}</Script>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
