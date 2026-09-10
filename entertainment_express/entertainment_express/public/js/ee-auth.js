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

  function getTargetSectionId(hash) {
    if (!hash || hash === '#' || hash === '#login') return 'login-section';
    if (hash === '#forgot') return 'forgot-section';
    if (hash === '#signup') return 'signup-section';
    if (hash === '#verify') return 'verify-section';
    var clean = hash.replace(/^#/, '');
    if (clean.endsWith('-section')) return clean;
    return clean + '-section';
  }

  function handleRouteHash() {
    var rawHash = window.location.hash || '#login';
    var targetSecId = getTargetSectionId(rawHash);
    var tabs = document.querySelectorAll('.ee-auth-nav-tab');
    var sections = document.querySelectorAll('.ee-auth-section');

    tabs.forEach(function (tab) {
      var href = tab.getAttribute('href') || '';
      var tabTarget = getTargetSectionId(href);
      if (tabTarget === targetSecId) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    sections.forEach(function (sec) {
      var id = sec.getAttribute('id');
      if (id === targetSecId) {
        sec.style.display = 'block';
        var firstInput = sec.querySelector('input:not([type="hidden"])');
        if (firstInput && (!document.activeElement || !document.activeElement.tagName.match(/INPUT|TEXTAREA/))) {
          setTimeout(function () { firstInput.focus(); }, 100);
        }
      } else {
        sec.style.display = 'none';
      }
    });
  }

  function setupAuthTabs() {
    document.querySelectorAll('.ee-auth-nav-tab, .ee-auth-forgot-link, a[href="#forgot"], a[href="#login"], a[href="#signup"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          if (window.location.hash !== href) {
            window.location.hash = href;
          } else {
            handleRouteHash();
          }
        }
      });
    });
  }

  function showAlert(form, message, type) {
    if (!form) return;
    var existing = form.querySelector('.ee-form-alert');
    if (existing) existing.remove();

    var alertBox = document.createElement('div');
    alertBox.className = 'ee-auth-alert ee-form-alert ' + (type === 'success' ? 'ee-auth-alert-success' : 'ee-auth-alert-danger');
    alertBox.setAttribute('role', 'alert');
    alertBox.innerHTML = '<span>' + message + '</span>';
    form.insertBefore(alertBox, form.firstChild);
  }

  function setButtonLoading(btn, isLoading, defaultText, loadingText) {
    if (!btn) return;
    var span = btn.querySelector('span') || btn;
    if (isLoading) {
      btn.classList.add('disabled');
      btn.setAttribute('disabled', 'disabled');
      span.textContent = loadingText;
    } else {
      btn.classList.remove('disabled');
      btn.removeAttribute('disabled');
      span.textContent = defaultText;
    }
  }

  function setupAuthForms() {
    // 1. Sign In Form (.form-login)
    var formLogin = document.querySelector('.form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailInput = document.getElementById('login_email');
        var pwdInput = document.getElementById('login_password');
        var usr = (emailInput ? emailInput.value : '').trim();
        var pwd = pwdInput ? pwdInput.value : '';

        if (!usr || !pwd) {
          showAlert(formLogin, 'Both email and password are required.', 'error');
          return;
        }

        var btn = formLogin.querySelector('.btn-login') || formLogin.querySelector('button[type="submit"]');
        var originalText = btn && btn.querySelector('span') ? btn.querySelector('span').textContent : 'Sign In';
        setButtonLoading(btn, true, originalText, 'Signing In...');

        if (typeof frappe !== 'undefined' && frappe.call) {
          frappe.call({
            type: 'POST',
            url: '/login',
            args: {
              cmd: 'login',
              usr: usr,
              pwd: pwd
            },
            freeze: true,
            callback: function (r) {
              setButtonLoading(btn, false, originalText, originalText);
              if (r.message === 'Logged In') {
                var urlParams = new URLSearchParams(window.location.search);
                var redirect = urlParams.get('redirect-to') || r.home_page || '/app';
                window.location.href = redirect;
              } else if (r.message === 'Password Reset') {
                window.location.href = r.redirect_to || '/update-password';
              } else if (r.verification) {
                // Two-factor required
                document.cookie = 'tmp_id=' + r.tmp_id;
                window.location.hash = '#verify';
              } else if (r.home_page) {
                window.location.href = r.home_page;
              }
            },
            error: function (err) {
              setButtonLoading(btn, false, originalText, originalText);
              var msg = 'Invalid login credentials. Please try again.';
              if (err && err.responseJSON && err.responseJSON._server_messages) {
                try {
                  var serverMsgs = JSON.parse(err.responseJSON._server_messages);
                  if (serverMsgs.length > 0) {
                    var parsed = typeof serverMsgs[0] === 'string' ? JSON.parse(serverMsgs[0]) : serverMsgs[0];
                    msg = parsed.message || msg;
                  }
                } catch (ex) {}
              }
              showAlert(formLogin, msg, 'error');
              if (pwdInput) {
                pwdInput.value = '';
                pwdInput.focus();
              }
            }
          });
        } else {
          // Fallback direct POST to /login
          fetch('/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'application/json'
            },
            body: new URLSearchParams({ cmd: 'login', usr: usr, pwd: pwd })
          })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            setButtonLoading(btn, false, originalText, originalText);
            if (data.message === 'Logged In') {
              var urlParams = new URLSearchParams(window.location.search);
              var redirect = urlParams.get('redirect-to') || data.home_page || '/app';
              window.location.href = redirect;
            } else {
              showAlert(formLogin, data.message || 'Invalid credentials.', 'error');
            }
          })
          .catch(function () {
            setButtonLoading(btn, false, originalText, originalText);
            showAlert(formLogin, 'Network error. Please try again.', 'error');
          });
        }
      });
    }

    // 2. Forgot Password Form (.form-forgot)
    var formForgot = document.querySelector('.form-forgot');
    if (formForgot) {
      formForgot.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailInput = document.getElementById('forgot_email');
        var user = (emailInput ? emailInput.value : '').trim();

        if (!user) {
          showAlert(formForgot, 'Please enter a valid email address.', 'error');
          return;
        }

        var btn = formForgot.querySelector('.btn-forgot') || formForgot.querySelector('button[type="submit"]');
        var originalText = btn && btn.querySelector('span') ? btn.querySelector('span').textContent : 'Send Password Reset Link';
        setButtonLoading(btn, true, originalText, 'Sending...');

        if (typeof frappe !== 'undefined' && frappe.call) {
          frappe.call({
            type: 'POST',
            url: '/',
            args: {
              cmd: 'frappe.core.doctype.user.user.reset_password',
              user: user
            },
            freeze: true,
            callback: function (r) {
              setButtonLoading(btn, false, originalText, originalText);
              if (r.message === 'not found') {
                showAlert(formForgot, 'No account found with this email address.', 'error');
              } else if (r.message === 'disabled') {
                showAlert(formForgot, 'This account is disabled. Please contact support.', 'error');
              } else {
                showAlert(formForgot, 'Password reset instructions have been emailed to you.', 'success');
              }
            },
            error: function (err) {
              setButtonLoading(btn, false, originalText, originalText);
              var msg = 'Unable to send password reset. Please try again.';
              if (err && err.responseJSON && err.responseJSON.message) {
                msg = err.responseJSON.message;
              }
              showAlert(formForgot, msg, 'error');
            }
          });
        } else {
          fetch('/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'application/json'
            },
            body: new URLSearchParams({
              cmd: 'frappe.core.doctype.user.user.reset_password',
              user: user
            })
          })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            setButtonLoading(btn, false, originalText, originalText);
            if (data.message === 'not found') {
              showAlert(formForgot, 'No account found with this email.', 'error');
            } else {
              showAlert(formForgot, 'Password reset instructions have been emailed.', 'success');
            }
          })
          .catch(function () {
            setButtonLoading(btn, false, originalText, originalText);
            showAlert(formForgot, 'Network error. Please try again.', 'error');
          });
        }
      });
    }

    // 3. Sign Up Form (.form-signup)
    var formSignup = document.querySelector('.form-signup');
    if (formSignup) {
      formSignup.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('signup_fullname');
        var emailInput = document.getElementById('signup_email');
        var fullName = (nameInput ? nameInput.value : '').trim();
        var email = (emailInput ? emailInput.value : '').trim();

        if (!fullName || !email) {
          showAlert(formSignup, 'Full name and email address are required.', 'error');
          return;
        }

        var btn = formSignup.querySelector('.btn-signup') || formSignup.querySelector('button[type="submit"]');
        var originalText = btn && btn.querySelector('span') ? btn.querySelector('span').textContent : 'Create Account';
        setButtonLoading(btn, true, originalText, 'Creating Account...');

        var urlParams = new URLSearchParams(window.location.search);
        var redirectTo = urlParams.get('redirect-to') || '/app';

        if (typeof frappe !== 'undefined' && frappe.call) {
          frappe.call({
            type: 'POST',
            url: '/',
            args: {
              cmd: 'frappe.core.doctype.user.user.sign_up',
              email: email,
              full_name: fullName,
              redirect_to: redirectTo
            },
            freeze: true,
            callback: function (r) {
              setButtonLoading(btn, false, originalText, originalText);
              if (Array.isArray(r.message) && r.message[0] === 0) {
                showAlert(formSignup, r.message[1] || 'Signup failed.', 'error');
              } else {
                var successMsg = (Array.isArray(r.message) ? r.message[1] : r.message) || 'Account created! Please check your email to activate.';
                showAlert(formSignup, successMsg, 'success');
              }
            },
            error: function (err) {
              setButtonLoading(btn, false, originalText, originalText);
              showAlert(formSignup, 'Signup request failed. Please try again.', 'error');
            }
          });
        }
      });
    }

    // 4. 2FA Verification Form (.form-verify)
    var formVerify = document.querySelector('.form-verify');
    if (formVerify) {
      formVerify.addEventListener('submit', function (e) {
        e.preventDefault();
        var tokenInput = document.getElementById('login_token');
        var otp = (tokenInput ? tokenInput.value : '').trim();
        if (!otp) {
          showAlert(formVerify, 'Please enter your verification code.', 'error');
          return;
        }

        var btn = formVerify.querySelector('.btn-verify') || formVerify.querySelector('button[type="submit"]');
        var originalText = btn && btn.querySelector('span') ? btn.querySelector('span').textContent : 'Verify';
        setButtonLoading(btn, true, originalText, 'Verifying...');

        var getCookie = function (name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return match ? match[3] : null;
        };

        if (typeof frappe !== 'undefined' && frappe.call) {
          frappe.call({
            type: 'POST',
            url: '/login',
            args: {
              cmd: 'login',
              otp: otp,
              tmp_id: getCookie('tmp_id')
            },
            freeze: true,
            callback: function (r) {
              setButtonLoading(btn, false, originalText, originalText);
              if (r.message === 'Logged In') {
                var urlParams = new URLSearchParams(window.location.search);
                var redirect = urlParams.get('redirect-to') || r.home_page || '/app';
                window.location.href = redirect;
              }
            },
            error: function () {
              setButtonLoading(btn, false, originalText, originalText);
              showAlert(formVerify, 'Invalid verification code.', 'error');
            }
          });
        }
      });
    }

    // 5. Update Password Form (#form-update-password)
    var formUpdatePwd = document.getElementById('form-update-password');
    if (formUpdatePwd) {
      formUpdatePwd.addEventListener('submit', function (e) {
        e.preventDefault();
        var oldPwdInput = document.getElementById('old_password');
        var newPwdInput = document.getElementById('new_password');
        var confirmPwdInput = document.getElementById('confirm_password');

        var oldPwd = oldPwdInput ? oldPwdInput.value : null;
        var newPwd = newPwdInput ? newPwdInput.value : '';
        var confirmPwd = confirmPwdInput ? confirmPwdInput.value : '';

        if (!newPwd) {
          showAlert(formUpdatePwd, 'Please enter a new password.', 'error');
          return;
        }
        if (newPwd !== confirmPwd) {
          showAlert(formUpdatePwd, 'Passwords do not match.', 'error');
          return;
        }

        var urlParams = new URLSearchParams(window.location.search);
        var key = urlParams.get('key');

        var btn = formUpdatePwd.querySelector('.btn-update-password') || formUpdatePwd.querySelector('button[type="submit"]');
        var originalText = btn && btn.querySelector('span') ? btn.querySelector('span').textContent : 'Save New Password';
        setButtonLoading(btn, true, originalText, 'Saving...');

        var args = {
          cmd: 'frappe.core.doctype.user.user.update_password',
          new_password: newPwd,
          key: key
        };
        if (oldPwd) args.old_password = oldPwd;

        if (typeof frappe !== 'undefined' && frappe.call) {
          frappe.call({
            type: 'POST',
            url: '/',
            args: args,
            freeze: true,
            callback: function (r) {
              setButtonLoading(btn, false, originalText, originalText);
              showAlert(formUpdatePwd, 'Password updated successfully! Redirecting...', 'success');
              setTimeout(function () {
                window.location.href = (typeof r.message === 'string' && r.message.startsWith('/')) ? r.message : '/app';
              }, 1200);
            },
            error: function (err) {
              setButtonLoading(btn, false, originalText, originalText);
              var msg = 'Password update failed.';
              if (err && err.responseJSON && err.responseJSON.message) {
                msg = err.responseJSON.message;
              }
              showAlert(formUpdatePwd, msg, 'error');
            }
          });
        }
      });
    }
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
    setupAuthTabs();
    setupAuthForms();
    window.addEventListener('hashchange', handleRouteHash);
    handleRouteHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
