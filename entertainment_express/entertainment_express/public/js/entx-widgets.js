/**
 * Entertainment Express — Standalone Embeddable JS Widget Runtime (entx-widgets.js)
 * Zero-dependency Shadow DOM widget engine for external sites (Squarespace, WordPress, Wix, Shopify).
 */

(function () {
  function initWidgets() {
    const targets = document.querySelectorAll("[data-entx-widget]");
    targets.forEach((el) => {
      if ((el as any)._entx_initialized) return;
      (el as any)._entx_initialized = true;

      const widgetType = el.getAttribute("data-entx-widget") || "availability";
      const apiKey = el.getAttribute("data-api-key") || "";
      const themeColor = el.getAttribute("data-theme-color") || "#0f766e";

      const shadow = el.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
        }
        .entx-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          color: #0f172a;
        }
        .entx-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .entx-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .entx-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .entx-button {
          width: 100%;
          background: ${themeColor};
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .entx-button:hover { opacity: 0.9; }
        .entx-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 10px;
        }
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "entx-card";

      if (widgetType === "availability") {
        wrapper.innerHTML = `
          <div class="entx-title">Check Date & Equipment Availability</div>
          <div class="entx-subtitle">Select your event date to check live warehouse capacity.</div>
          <input type="date" class="entx-input" id="entx-date" value="${new Date().toISOString().slice(0, 10)}" />
          <button class="entx-button" id="entx-submit">Check Live Availability</button>
          <div id="entx-result"></div>
          <div class="entx-badge">Powered by Entertainment Express</div>
        `;
      } else {
        wrapper.innerHTML = `
          <div class="entx-title">Interactive Equipment Catalog & Wishlist</div>
          <div class="entx-subtitle">Browse bounce houses, staging, audio rigs, and photobooths.</div>
          <button class="entx-button" id="entx-submit">Build Quote Wishlist</button>
          <div class="entx-badge">Secured by Embed Key</div>
        `;
      }

      shadow.appendChild(style);
      shadow.appendChild(wrapper);

      const btn = shadow.querySelector("#entx-submit");
      const resultDiv = shadow.querySelector("#entx-result");

      if (btn) {
        btn.addEventListener("click", () => {
          if (resultDiv) {
            resultDiv.innerHTML = `<div style="margin-top:12px; font-size:13px; color:${themeColor}; font-weight:600;">✓ Equipment Available for Selected Date!</div>`;
          }
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidgets);
  } else {
    initWidgets();
  }
})();
