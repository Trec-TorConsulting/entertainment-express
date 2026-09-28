import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { tenantBase } from "../support/session";
import fs from "fs";
import path from "path";

function getLocalSignupHtml(): string {
  const filePath = path.resolve(__dirname, "../../../entertainment_express/entertainment_express/www/signup.html");
  let content = fs.readFileSync(filePath, "utf-8");
  content = content.replace(/{%\s*extends[^%]*%}/g, "");
  content = content.replace(/{%\s*block[^%]*%}/g, "");
  content = content.replace(/{%\s*endblock\s*%}/g, "");
  content = content.replace(/\{\{\s*\(tenant_domain\s+or\s+"entx\.app"\)\s*\|\s*tojson\s*\}\}/g, '"entx.app"');
  content = content.replace(/\{\{\s*tenant_domain\s+or\s+"entx\.app"\s*\}\}/g, "entx.app");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <script>
    window.frappe = {
      call: async function(opts) {
        if (window.__mockFrappeCall) {
          return window.__mockFrappeCall(opts);
        }
        var slug = (opts.args && opts.args.requested_slug) || "soundefxdjs";
        return { message: { ok: true, status: "submitted", site_url: "https://" + slug + ".entx.app" } };
      }
    };
  </script>
</head>
<body>
  ${content}
</body>
</html>`;
}

function getLocalStartTrialHtml(): string {
  const filePath = path.resolve(__dirname, "../../../entertainment_express/entertainment_express/www/start_trial.html");
  let content = fs.readFileSync(filePath, "utf-8");
  content = content.replace(/{%\s*extends[^%]*%}/g, "");
  content = content.replace(/{%\s*block[^%]*%}/g, "");
  content = content.replace(/{%\s*endblock\s*%}/g, "");
  content = content.replace(/\{\{\s*tenant_domain\s*\|\s*tojson\s*\}\}/g, '"entx.app"');
  content = content.replace(/\{\{\s*tenant_domain\s*\}\}/g, "entx.app");
  content = content.replace(/\{\{\s*plan\s*\}\}/g, "starter");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    window.frappe = {
      call: async function(opts) {
        if (window.__mockFrappeCall) {
          return window.__mockFrappeCall(opts);
        }
        var slug = (opts.args && opts.args.payload && opts.args.payload.requested_slug) || "soundefxdjs";
        return { message: { ok: true, site_url: "https://" + slug + ".entx.app" } };
      }
    };
  </script>
</head>
<body>
  ${content}
</body>
</html>`;
}

test.describe("Public & Guest — Free Trial Signup End-to-End Regression", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. SaaS signup page loads with form fields, live preview, and no console errors", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());
    await assertNoErrors(page, "Local Rendered SaaS Signup Page");

    const form = page.locator("#signup-form");
    await expect(form).toBeVisible();

    const companyInput = page.locator('input[name="company_name"]');
    const slugInput = page.locator('input[name="requested_slug"]');
    const emailInput = page.locator('input[name="contact_email"]');
    const submitBtn = page.locator("#signup-submit-btn");
    const preview = page.locator("#signup-slug-preview");

    await expect(companyInput).toBeVisible();
    await expect(slugInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(".entx.app");
  });

  test("2. Auto-slugifies company name 'SoundEFXDjs' into DNS-safe slug and live preview", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());

    const companyInput = page.locator('input[name="company_name"]');
    const slugInput = page.locator('input[name="requested_slug"]');
    const preview = page.locator("#signup-slug-preview");

    // Type "SoundEFXDjs"
    await companyInput.fill("SoundEFXDjs");
    await expect(slugInput).toHaveValue("soundefxdjs");
    await expect(preview).toContainText("https://soundefxdjs.entx.app");

    // Type "SoundEFX DJs" with space
    await companyInput.fill("SoundEFX DJs");
    await expect(slugInput).toHaveValue("soundefx-djs");
    await expect(preview).toContainText("https://soundefx-djs.entx.app");

    // Type special characters "Sound & Light Co.!"
    await companyInput.fill("Sound & Light Co.!");
    await expect(slugInput).toHaveValue("sound-light-co");
    await expect(preview).toContainText("https://sound-light-co.entx.app");
  });

  test("3. Direct slug input normalizes uppercase 'SoundEFXDjs' to lowercase without validation block", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());

    const slugInput = page.locator('input[name="requested_slug"]');
    const preview = page.locator("#signup-slug-preview");

    // Direct user typing into slug field with uppercase and invalid characters
    await slugInput.fill("SoundEFXDjs_HQ!");
    await expect(slugInput).toHaveValue("soundefxdjs-hq-");
    await slugInput.blur();
    await expect(slugInput).toHaveValue("soundefxdjs-hq");
    await expect(preview).toContainText("https://soundefxdjs-hq.entx.app");
  });

  test("4. Form client-side validation prevents empty and invalid submissions", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());

    const submitBtn = page.locator("#signup-submit-btn");
    const companyInput = page.locator('input[name="company_name"]');
    const emailInput = page.locator('input[name="contact_email"]');
    const slugInput = page.locator('input[name="requested_slug"]');

    // Click submit when empty
    await submitBtn.click();
    await expect(companyInput).toHaveClass(/is-invalid/);

    // Fill valid company but invalid email
    await companyInput.fill("SoundEFX DJs");
    await emailInput.fill("notanemail");
    await submitBtn.click();
    await expect(emailInput).toHaveClass(/is-invalid/);

    // Slug too short
    await emailInput.fill("tester@example.com");
    await slugInput.fill("ab");
    await submitBtn.click();
    await expect(slugInput).toHaveClass(/is-invalid/);
  });

  test("5. Displays visible server error without freezing UI on taken or reserved slug", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());

    // Inject mock RPC failure (e.g. taken slug or reserved slug)
    await page.evaluate(() => {
      window.__mockFrappeCall = async function (opts) {
        return {
          message: {
            ok: false,
            status: "error",
            error: "Slug 'soundefxdjs' is already taken.",
          },
        };
      };
    });

    const companyInput = page.locator('input[name="company_name"]');
    const slugInput = page.locator('input[name="requested_slug"]');
    const emailInput = page.locator('input[name="contact_email"]');
    const submitBtn = page.locator("#signup-submit-btn");
    const errorAlert = page.locator("#signup-error");

    await companyInput.fill("SoundEFXDjs");
    await emailInput.fill("dj@example.com");

    await submitBtn.click();

    // Error alert must be shown and not empty
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Slug 'soundefxdjs' is already taken.");
    await expect(slugInput).toHaveClass(/is-invalid/);

    // Form and button must NOT be frozen/disabled permanently
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn.locator(".btn-text")).toHaveText("Continue to checkout");
  });

  test("6. Successful submission shows confirmation and hides form without redirect", async ({ page }) => {
    await page.setContent(getLocalSignupHtml());

    await page.evaluate(() => {
      window.__mockFrappeCall = async function (opts) {
        return {
          message: {
            ok: true,
            status: "submitted",
            message: "Application submitted!",
            site_url: "https://soundefxdjs.entx.app",
          },
        };
      };
    });

    const companyInput = page.locator('input[name="company_name"]');
    const emailInput = page.locator('input[name="contact_email"]');
    const submitBtn = page.locator("#signup-submit-btn");
    const successAlert = page.locator("#signup-success");
    const form = page.locator("#signup-form");

    await companyInput.fill("SoundEFXDjs");
    await emailInput.fill("soundefxdj@gmail.com");

    await submitBtn.click();

    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText("https://soundefxdjs.entx.app");
    await expect(form).not.toBeVisible();
  });

  test("7. Marketing trial page (/start-trial) auto-slugifies 'SoundEFXDjs' and handles submission", async ({ page }) => {
    await page.setContent(getLocalStartTrialHtml());

    const companyInput = page.locator("#trial-company");
    const slugInput = page.locator("#trial-slug");
    const preview = page.locator("#trial-slug-preview");
    const submitBtn = page.locator("button[type='submit']");
    const statusBox = page.locator("#trial-status");

    await companyInput.fill("SoundEFXDjs");
    await expect(slugInput).toHaveValue("soundefxdjs");
    await expect(preview).toContainText("https://soundefxdjs.entx.app");

    // Direct editing with uppercase
    await slugInput.fill("SoundEFX-Live");
    await slugInput.blur();
    await expect(slugInput).toHaveValue("soundefx-live");

    // Submit
    const emailInput = page.locator("#trial-email");
    await emailInput.fill("trial@soundefx.com");
    await submitBtn.click();

    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText("https://soundefx-live.entx.app");
  });

  test("8. Portal user registration form (/login#signup) renders when enabled or respects disable_signup", async ({ page }) => {
    const authJsPath = path.resolve(__dirname, "../../../entertainment_express/entertainment_express/public/js/ee-auth.js");
    await page.route("**/ee-auth.js*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: fs.readFileSync(authJsPath, "utf-8"),
      })
    );

    await page.goto(`${tenantBase()}/login#signup`, { waitUntil: "domcontentloaded" });
    await assertNoErrors(page, "Login/Register Page");

    const signupSection = page.locator("#signup-section");
    const count = await signupSection.count();

    if (count > 0) {
      await expect(signupSection).toBeVisible();

      const nameInput = page.locator("#signup_fullname");
      const emailInput = page.locator("#signup_email");
      const signupBtn = page.locator(".btn-signup");

      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(signupBtn).toBeVisible();

      // Submitting empty flags required inputs
      await signupBtn.click();
      const alert = signupSection.locator(".ee-form-alert");
      await expect(alert).toBeVisible();
      await expect(signupBtn).toBeEnabled();
    } else {
      // When disable_signup is active on site, login form remains cleanly accessible
      const loginSection = page.locator("#login-section");
      await expect(loginSection).toBeVisible();
    }
  });
});
