## Context

Recent security audits revealed critical vulnerabilities across the platform:
1. XSS risks via `dangerouslySetInnerHTML` in React portals.
2. Token exposure via `localStorage` in web clients and `AsyncStorage` in the mobile app.
3. Insufficient row-level access control on Frappe APIs, presenting an IDOR (Broken Access Control) risk in multi-tenant environments.

## Goals / Non-Goals

**Goals:**
- Eliminate DOM-based XSS via strict HTML sanitization in React.
- Secure session tokens using HttpOnly cookies for web, and Secure Store for mobile.
- Enforce strict `if_owner` backend checks to prevent cross-tenant or cross-user data leakage.

**Non-Goals:**
- Complete restructuring of the auth system (we still use JWTs, but changing how they are stored/transmitted).
- Extensive UI/UX changes.

## Decisions

1. **HttpOnly Cookies for Web Auth**: We will move from `Authorization: Bearer` headers powered by `localStorage` to `HttpOnly`, `SameSite=Strict` cookies set by the backend upon login. 
   - *Rationale*: Eliminates XSS token theft. Web API client (Axios) will simply include credentials.
2. **DOMPurify for Sanitization**: Where rich text rendering is required, we will wrap inputs with DOMPurify.
   - *Rationale*: Standard library, battle-tested against XSS vectors.
3. **`expo-secure-store` for Mobile**: The Crew app cannot use HttpOnly cookies easily without a webview, so we continue using headers but store the token natively in the secure enclave.
   - *Rationale*: Expo's secure store uses iOS Keychain and Android Keystore, which is not accessible to local storage sniffers.
4. **Backend `if_owner` decorators/checks**: All whitelisted Frappe API methods accessing records will verify the `owner` field against the `frappe.session.user`.

## Risks / Trade-offs

- [Risk] HttpOnly cookies might break CORS setups or cross-domain API calls.
  - Mitigation: Ensure `SameSite` and CORS settings are correctly configured in `entertainment_express` app hooks for the base domain.
- [Risk] DOMPurify stripping legitimate but complex HTML formatting in contracts.
  - Mitigation: Carefully configure DOMPurify ALLOW_TAGS and ALLOW_ATTR to support our rich text editor features.
