## 1. Eliminate XSS (DOMPurify Implementation)

- [x] 1.1 Add `dompurify` and `@types/dompurify` dependencies to web frontend packages (`customer-portal`, `owner-portal`, `dispatch-portal`).
- [x] 1.2 Create a shared `SafeHtml` React component in the portal UI kit that uses DOMPurify to sanitize and render HTML strings.
- [x] 1.3 Identify all usages of `dangerouslySetInnerHTML` in the frontends using grep/ripgrep.
- [x] 1.4 Replace `dangerouslySetInnerHTML` with the new `SafeHtml` component.

## 2. Secure Token Storage (HttpOnly Cookies for Web)

- [x] 2.1 Update backend `auth_jwt.py` (or equivalent login handler) to return a `Set-Cookie` header containing the JWT token with `HttpOnly` and `SameSite=Strict`.
- [x] 2.2 Update backend middleware to read the JWT from the `Authorization` header OR the newly created cookie.
- [x] 2.3 Update web frontend API clients (Axios) to set `withCredentials: true` globally so cookies are sent with every request.
- [x] 2.4 Update web frontend auth state managers to remove JWT storage/retrieval from `localStorage`.
- [x] 2.5 Ensure the logout endpoints and UI clear the HttpOnly cookie.

## 3. Secure Token Storage (Mobile App)

- [x] 3.1 Add `expo-secure-store` dependency to the `crew-app` project.
- [x] 3.2 Update `crew-app` authentication service to use `SecureStore.setItemAsync` and `SecureStore.getItemAsync` instead of `AsyncStorage` for the JWT token.
- [x] 3.3 Ensure token revocation clears the secure store.

## 4. Broken Access Control (IDOR Prevention)

- [x] 4.1 Audit all whitelisted Frappe API methods in `entertainment_express` app that read/write tenant data.
- [x] 4.2 Update backend `request_guards.py` to expose an `enforce_ownership` validator.
- [x] 4.3 Apply row-level ownership checks (`if_owner`) to document fetches and updates in the custom API endpoints, ensuring users can only interact with their permitted documents.
- [x] 4.4 Run backend tests to verify tenant boundary isolation.
