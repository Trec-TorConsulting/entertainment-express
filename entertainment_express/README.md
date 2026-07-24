# Entertainment Express

Custom Frappe application for **Entertainment Express (EE)** — a multi-tenant SaaS ERP/CRM platform for
mobile entertainment companies (DJs, inflatable rentals, photo/360 booths, game trucks, casino/karaoke,
performers).

## Requirements

- Python 3.11+
- Frappe v15 / ERPNext v15 bench
- MariaDB 10.6+
- Redis

## Development Setup

```bash
bench get-app entertainment_express https://github.com/your-org/entertainment_express
bench --site <site> install-app entertainment_express
```

## Spec

See `openspec/` at the workspace root for the full product spec (26 capabilities, 18 implementation phases).
Start with `openspec/project.md`.
