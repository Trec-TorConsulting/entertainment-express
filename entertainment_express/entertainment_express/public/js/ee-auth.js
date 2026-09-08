/**
 * Entertainment Express - Authentication & System Page Enhancements
 * Progressive UX enhancements: password visibility toggling, tab synchronization,
 * autofocus, and password strength indicators.
 */

(function () {
  'use strict';

  function setupPasswordToggles() {
    document.querySelectorAll('.ee-password-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = btn.getAttribute('data-target');
        var input = targetId ? document.getElementById(targetId) : btn.previousElementSibling;
        if (!input) return;

        var isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');

        // Toggle icon SVG
        var eyeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
        var eyeOffSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
        btn.innerHTML = isPassword ? eyeOffSvg : eyeSvg;
      });
    });
  }

  function handleRouteHash() {
    var hash = window.location.hash || '#login';
    var tabs = document.querySelectorAll('.ee-auth-nav-tab');
    var sections = document.querySelectorAll('.ee-auth-section');

    tabs.forEach(function (tab) {
      var href = tab.getAttribute('href') || '';
      if (href === hash || (hash === '#login' && href.indexOf('#login') !== -1)) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    sections.forEach(function (sec) {
      var id = sec.getAttribute('id');
      if (('#' + id) === hash || (hash === '#login' && id === 'login-section')) {
        sec.style.display = 'block';
        var firstInput = sec.querySelector('input:not([type="hidden"])');
        if (firstInput && !document.activeElement.tagName.match(/INPUT|TEXTAREA/)) {
          setTimeout(function () { firstInput.focus(); }, 100);
        }
      } else {
        sec.style.display = 'none';
      }
    });
  }

  function setupPasswordStrength() {
    var newPwdInput = document.getElementById('new_password');
    if (!newPwdInput) return;

    var ruleLength = document.getElementById('rule-length');
    var ruleNumber = document.getElementById('rule-number');
    var ruleLetter = document.getElementById('rule-letter');

    newPwdInput.addEventListener('input', function () {
      var val = newPwdInput.value || '';
      if (ruleLength) {
        if (val.length >= 8) {
          ruleLength.classList.add('valid');
          ruleLength.classList.remove('invalid');
        } else {
          ruleLength.classList.remove('valid');
          ruleLength.classList.add('invalid');
        }
      }
      if (ruleNumber) {
        if (/\d/.test(val)) {
          ruleNumber.classList.add('valid');
          ruleNumber.classList.remove('invalid');
        } else {
          ruleNumber.classList.remove('valid');
          ruleNumber.classList.add('invalid');
        }
      }
      if (ruleLetter) {
        if (/[a-zA-Z]/.test(val)) {
          ruleLetter.classList.add('valid');
          ruleLetter.classList.remove('invalid');
        } else {
          ruleLetter.classList.remove('valid');
          ruleLetter.classList.add('invalid');
        }
      }
    });
  }

  function init() {
    setupPasswordToggles();
    setupPasswordStrength();
    window.addEventListener('hashchange', handleRouteHash);
    handleRouteHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
