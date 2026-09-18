# System-Wide Portal Crawler Execution Report

- **Execution Time**: 2026-09-18T18:58:21.343Z
- **Target Base URL**: https://e2esmoke.entx.app
- **Total Routes Visited**: 16
- **Total Errors Detected**: 13

## Visited Portal Summary

| Portal | Role | URL | Status | Links Discovered |
| :--- | :--- | :--- | :--- | :--- |
| Owner Portal | Owner | `/owner/` | ✅ OK | 0 |
| Employee Portal | Employee | `/employee/` | ✅ OK | 0 |
| Dispatch Portal | Dispatcher | `/dispatch/` | ✅ OK | 0 |
| Crew App | Crew | `/crew/` | ❌ ERROR | 0 |
| Customer Portal | Customer | `/client/` | ✅ OK | 0 |
| Public Website | Guest | `/` | ✅ OK | 22 |
| Public Website | Guest | `/catalog` | ✅ OK | 12 |
| Public Website | Guest | `/request-quote` | ✅ OK | 12 |
| Public Website | Guest | `/login` | ✅ OK | 1 |
| Public Website | Guest | `/login?redirect-to=/client` | ✅ OK | 1 |
| Public Website | Guest | `/request-quote?package=starter-signature` | ✅ OK | 12 |
| Public Website | Guest | `/request-quote?package=starter-premium` | ✅ OK | 12 |
| Public Website | Guest | `/request-quote?package=starter-grand` | ✅ OK | 12 |
| Public Website | Guest | `/book` | ✅ OK | 12 |
| Public Website | Guest | `/client` | ✅ OK | 1 |
| Public Website | Guest | `/signup` | ✅ OK | 12 |

## Detected Frontend Errors

| Portal | Role | URL | Error Type | Message |
| :--- | :--- | :--- | :--- | :--- |
| Owner Portal | Owner | `https://e2esmoke.entx.app/login` | **console_error** | Failed to load resource: the server responded with a status of 401 () |
| Owner Portal | Owner | `https://e2esmoke.entx.app/login` | **console_error** | Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 100, in application
    init_request(request)
  File "apps/frappe/frappe/a |
| Employee Portal | Employee | `https://e2esmoke.entx.app/login` | **console_error** | Failed to load resource: the server responded with a status of 401 () |
| Employee Portal | Employee | `https://e2esmoke.entx.app/login` | **console_error** | Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 100, in application
    init_request(request)
  File "apps/frappe/frappe/a |
| Dispatch Portal | Dispatcher | `https://e2esmoke.entx.app/login` | **console_error** | Failed to load resource: the server responded with a status of 401 () |
| Dispatch Portal | Dispatcher | `https://e2esmoke.entx.app/login` | **console_error** | Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 100, in application
    init_request(request)
  File "apps/frappe/frappe/a |
| Crew App | Crew | `https://e2esmoke.entx.app/login` | **console_error** | Failed to load resource: the server responded with a status of 401 () |
| Crew App | Crew | `https://e2esmoke.entx.app/login` | **console_error** | Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 100, in application
    init_request(request)
  File "apps/frappe/frappe/a |
| Crew App | Crew | `https://e2esmoke.entx.app/login` | **network_failure** | HTTP 404 on https://e2esmoke.entx.app/crew/ |
| Crew App | Crew | `https://e2esmoke.entx.app/crew/` | **console_error** | Failed to load resource: the server responded with a status of 404 () |
| Crew App | Crew | `https://e2esmoke.entx.app/crew/` | **dead_link** | Page returned HTTP 404 |
| Customer Portal | Customer | `https://e2esmoke.entx.app/login` | **console_error** | Failed to load resource: the server responded with a status of 401 () |
| Customer Portal | Customer | `https://e2esmoke.entx.app/login` | **console_error** | Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 100, in application
    init_request(request)
  File "apps/frappe/frappe/a |
