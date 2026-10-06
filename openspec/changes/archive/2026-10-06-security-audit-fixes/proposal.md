## Why

A recent security audit identified critical vulnerabilities: stored XSS through `dangerouslySetInnerHTML`, insecure token storage in `localStorage` and `AsyncStorage`, and potential Broken Access Control (IDOR) due to missing row-level tenant security. Remedying these immediately is essential to protect tenant data, prevent session hijacking, and uphold our enterprise multi-tenant isolation guarantees.

## What Changes

- **BREAKING**: Transition web portal authentication from `localStorage` JWTs to secure, `HttpOnly`, `SameSite=Strict` cookies.
- Transition mobile app (`crew-app`) token storage from `AsyncStorage` to `expo-secure-store`.
- Implement robust HTML sanitization (e.g., using DOMPurify) to replace all unsafe `dangerouslySetInnerHTML` usages across React frontends.
- Enforce strict row-level ownership validation (`if_owner` constraints) in backend `request_guards.py` and across all Frappe API whitelisted methods.

## Capabilities

### New Capabilities
- `platform-security`: Centralized security enforcements, including HTML sanitization utilities and cookie-based auth bridges.

### Modified Capabilities
- `identity-access`: Updating JWT delivery to use HttpOnly cookies for web clients and updating token lifecycle management.
- `platform-multitenancy`: Enforcing strict row-level (`if_owner`) access controls at the API layer.
- `customer-portal`: Updating auth state hydration and removing unsafe HTML rendering.
- `owner-portal`: Removing unsafe HTML rendering in the RichContractEditor and other components.
- `mobile-field-app`: Updating the React Native app to use `expo-secure-store` for JWT.

## Impact

- **Web Frontends**: `customer-portal`, `owner-portal`, `dispatch-portal` will need to rely on API calls that expect cookies rather than setting `Authorization: Bearer` headers from `localStorage`.
- **Mobile Frontend**: `crew-app` dependency update and state management update for token handling.
- **Backend APIs**: Authentication middleware (`auth_jwt.py` and endpoints) must be updated to set and read cookies appropriately.
- **Database / API Layer**: All read/write API endpoints will undergo strict ownership permission testing to patch any IDOR pathways.
