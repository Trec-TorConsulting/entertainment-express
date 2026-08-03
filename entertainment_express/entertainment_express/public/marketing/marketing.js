(function () {
  function getConsentState() {
    return localStorage.getItem("ee_consent") || "";
  }

  function loadAnalyticsIfConsented() {
    if (getConsentState() !== "accepted") {
      return;
    }
    if (!window.eeAnalyticsConfig || window.eeAnalyticsLoaded) {
      return;
    }

    var config = window.eeAnalyticsConfig;
    var script = document.createElement("script");
    script.async = true;

    if (config.provider === "plausible") {
      script.src = "https://plausible.io/js/script.js";
      script.setAttribute("data-domain", config.siteId);
    } else if (config.provider === "umami") {
      script.src = "https://umami.is/script.js";
      script.setAttribute("data-website-id", config.siteId);
    } else if (config.provider === "ga4") {
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.siteId);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", config.siteId, { anonymize_ip: true });
    } else {
      return;
    }

    document.head.appendChild(script);
    window.eeAnalyticsLoaded = true;
  }

  function trackConversion(eventName) {
    if (getConsentState() !== "accepted") {
      return;
    }
    if (!window.eeAnalyticsConfig) {
      return;
    }

    var provider = window.eeAnalyticsConfig.provider;
    if (provider === "plausible" && typeof window.plausible === "function") {
      window.plausible(eventName);
    }
    if (provider === "umami" && window.umami && typeof window.umami.track === "function") {
      window.umami.track(eventName);
    }
    if (provider === "ga4" && typeof window.gtag === "function") {
      window.gtag("event", eventName);
    }
  }

  window.eeTrackConversion = trackConversion;

  function getUtmFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || ""
    };
  }

  function captureAttribution() {
    var utm = getUtmFromUrl();
    var hasAny = Object.values(utm).some(Boolean);
    if (hasAny) {
      localStorage.setItem("ee_utm", JSON.stringify(utm));
    }

    var saved = localStorage.getItem("ee_utm");
    if (!saved) {
      return;
    }

    var parsed;
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      return;
    }

    Object.keys(parsed).forEach(function (key) {
      var fields = document.querySelectorAll('input[name="' + key + '"]');
      fields.forEach(function (field) {
        field.value = parsed[key] || "";
      });
    });

    document.querySelectorAll('input[name="referrer"]').forEach(function (referrerField) {
      referrerField.value = document.referrer || "";
    });
  }

  function initNav() {
    var toggle = document.getElementById("ee-nav-toggle");
    var menu = document.getElementById("ee-nav-menu");
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function initPricingToggle() {
    var controls = document.querySelectorAll("[data-billing-toggle]");
    if (!controls.length) {
      return;
    }

    controls.forEach(function (control) {
      control.addEventListener("click", function () {
        var mode = control.getAttribute("data-billing-toggle");
        document.querySelectorAll("[data-price-monthly]").forEach(function (priceEl) {
          var monthly = priceEl.getAttribute("data-price-monthly") || "0";
          var annual = priceEl.getAttribute("data-price-annual") || monthly;
          priceEl.textContent = mode === "annual" ? annual : monthly;
        });
      });
    });
  }

  function initConsentBanner() {
    var banner = document.getElementById("ee-consent");
    if (!banner) {
      return;
    }

    var accepted = localStorage.getItem("ee_consent");
    if (!accepted) {
      banner.hidden = false;
    } else {
      loadAnalyticsIfConsented();
    }

    var accept = document.getElementById("ee-consent-accept");
    var reject = document.getElementById("ee-consent-reject");
    if (accept) {
      accept.addEventListener("click", function () {
        localStorage.setItem("ee_consent", "accepted");
        banner.hidden = true;
        loadAnalyticsIfConsented();
      });
    }

    if (reject) {
      reject.addEventListener("click", function () {
        localStorage.setItem("ee_consent", "rejected");
        banner.hidden = true;
      });
    }
  }

  function initLeadForms() {
    var forms = document.querySelectorAll(".ee-form[data-lead-type]");
    forms.forEach(function (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var status = form.querySelector(".ee-form-status");
        if (status) {
          status.textContent = "Submitting...";
        }

        var data = Object.fromEntries(new FormData(form).entries());

        try {
          await frappe.call({
            method: "entertainment_express.api.marketing.submit_lead",
            args: { payload: data }
          });

          if (status) {
            status.textContent = "Thanks. We received your request.";
          }
          trackConversion((data.lead_type || "contact") + "_submitted");
          form.reset();
        } catch (error) {
          if (status) {
            status.textContent = "We could not submit your request. Please try again.";
          }
        }
      });
    });
  }

  function initNewsletterForm() {
    var form = document.getElementById("ee-newsletter-form");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var status = form.querySelector(".ee-form-status");
      if (status) {
        status.textContent = "Submitting...";
      }

      var data = Object.fromEntries(new FormData(form).entries());
      try {
        await frappe.call({
          method: "entertainment_express.api.marketing.subscribe_newsletter",
          args: { payload: data }
        });
        if (status) {
          status.textContent = "Check your inbox to confirm your subscription.";
        }
        trackConversion("newsletter_subscribed");
        form.reset();
      } catch (error) {
        if (status) {
          status.textContent = "Unable to subscribe. Please try again.";
        }
      }
    });
  }

  initNav();
  captureAttribution();
  initPricingToggle();
  initConsentBanner();
  initLeadForms();
  initNewsletterForm();
})();
