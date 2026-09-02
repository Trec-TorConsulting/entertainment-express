/*! Entertainment Express embed widgets */
(function (global) {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function apiBase(el) {
    return el.getAttribute("data-ee-api") || "";
  }

  function keyOf(el) {
    return el.getAttribute("data-ee-key") || "";
  }

  function call(base, method, args) {
    var url = (base || "") + "/api/method/" + method;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EE-Embed-Key": args.key || "" },
      body: JSON.stringify(args || {}),
      credentials: "omit",
      mode: "cors",
    }).then(function (r) {
      return r.json();
    }).then(function (payload) {
      if (payload.exc) throw new Error("Embed request failed");
      return payload.message;
    });
  }

  function el(tag, style, text) {
    var node = document.createElement(tag);
    if (style) node.setAttribute("style", style);
    if (text != null) node.textContent = text;
    return node;
  }

  function mountCatalog(host) {
    var base = apiBase(host);
    var key = keyOf(host);
    var box = el("div", "font-family:system-ui,sans-serif;border:1px solid #e7e5e4;padding:1rem;border-radius:8px");
    box.appendChild(el("p", "margin:0 0 0.5rem;font-weight:600", "Packages"));
    host.appendChild(box);
    call(base, "entertainment_express.api.embed.catalog", { key: key })
      .then(function (data) {
        (data.packages || []).forEach(function (pkg) {
          var row = el("div", "padding:0.5rem 0;border-top:1px solid #f5f5f4");
          row.appendChild(el("strong", null, pkg.name || pkg.id));
          if (pkg.rate) row.appendChild(el("span", "margin-left:0.5rem;color:#57534e", pkg.rate));
          box.appendChild(row);
        });
        if (!(data.packages || []).length) box.appendChild(el("p", "color:#78716c", "No packages published yet."));
      })
      .catch(function () {
        box.appendChild(el("p", "color:#b91c1c", "Could not load catalog."));
      });
  }

  function mountAvailability(host) {
    var base = apiBase(host);
    var key = keyOf(host);
    var date = host.getAttribute("data-ee-date") || new Date().toISOString().slice(0, 10);
    var box = el("div", "font-family:system-ui,sans-serif;padding:1rem;border:1px solid #e7e5e4;border-radius:8px");
    host.appendChild(box);
    call(base, "entertainment_express.api.embed.availability", { key: key, date: date })
      .then(function (data) {
        box.appendChild(el("p", "margin:0;font-weight:600", data.available ? "Available" : "Limited"));
        box.appendChild(el("p", "margin:0.35rem 0 0;color:#57534e", data.message || ""));
        if (data.book_url) {
          var a = el("a", "display:inline-block;margin-top:0.75rem;color:#0f766e", "Book now");
          a.href = data.book_url;
          box.appendChild(a);
        }
      })
      .catch(function () {
        box.appendChild(el("p", "color:#b91c1c", "Could not check availability."));
      });
  }

  function mountBook(host) {
    var base = apiBase(host);
    var key = keyOf(host);
    var pkg = host.getAttribute("data-ee-package") || "";
    var btn = el("button", "font-family:system-ui,sans-serif;background:#0f766e;color:#fff;border:0;padding:0.75rem 1.25rem;border-radius:6px;cursor:pointer", host.getAttribute("data-ee-label") || "Book now");
    host.appendChild(btn);
    btn.addEventListener("click", function () {
      call(base, "entertainment_express.api.embed.book_link", { key: key, package: pkg })
        .then(function (data) {
          if (data && data.url) global.location.href = data.url;
        });
    });
  }

  function mountWishlist(host) {
    var base = apiBase(host);
    var key = keyOf(host);
    var box = el("div", "font-family:system-ui,sans-serif;padding:1rem;border:1px dashed #d6d3d1;border-radius:8px");
    box.appendChild(el("p", "margin:0 0 0.5rem;font-weight:600", "Saved packages"));
    host.appendChild(box);
    call(base, "entertainment_express.api.embed.wishlist", { key: key })
      .then(function (data) {
        var saved = [];
        try {
          saved = JSON.parse(global.localStorage.getItem("ee_wishlist") || "[]");
        } catch (e) {
          saved = [];
        }
        var map = {};
        (data.packages || []).forEach(function (p) {
          map[p.id] = p;
        });
        if (!saved.length) {
          box.appendChild(el("p", "color:#78716c;margin:0", "Save packages while browsing — they stay on this device."));
          return;
        }
        saved.forEach(function (id) {
          var pkg = map[id] || { name: id };
          box.appendChild(el("p", "margin:0.25rem 0", pkg.name || id));
        });
      })
      .catch(function () {
        box.appendChild(el("p", "color:#b91c1c", "Could not load wishlist."));
      });
  }

  function mountReviews(host) {
    var base = apiBase(host);
    var key = keyOf(host);
    var box = el("div", "font-family:system-ui,sans-serif");
    host.appendChild(box);
    call(base, "entertainment_express.api.embed.reviews", { key: key })
      .then(function (data) {
        if (data.review_url) {
          var a = el("a", "color:#0f766e;font-weight:600", data.label || "See our reviews");
          a.href = data.review_url;
          a.target = "_blank";
          a.rel = "noopener";
          box.appendChild(a);
        } else {
          box.appendChild(el("p", "color:#78716c;margin:0", "Reviews coming soon."));
        }
      });
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-ee-widget]");
    Array.prototype.forEach.call(nodes, function (host) {
      if (host.getAttribute("data-ee-mounted")) return;
      host.setAttribute("data-ee-mounted", "1");
      var kind = host.getAttribute("data-ee-widget");
      if (kind === "catalog") mountCatalog(host);
      else if (kind === "availability") mountAvailability(host);
      else if (kind === "book") mountBook(host);
      else if (kind === "wishlist") mountWishlist(host);
      else if (kind === "reviews") mountReviews(host);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  global.EEEmbed = { boot: boot };
})(typeof window !== "undefined" ? window : this);
