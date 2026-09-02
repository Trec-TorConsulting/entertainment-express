# Entertainment Express

Custom Frappe application for **Entertainment Express (EE)** — a multi-tenant SaaS ERP/CRM platform for
mobile entertainment companies (DJs, inflatable rentals, photo/360 booths, game trucks, casino/karaoke,
performers).

## Requirements

- Python 3.11+
- Frappe v15 / ERPNext v15 bench
- MariaDB 10.6+
- Redis

## Development setup

```bash
bench get-app entertainment_express https://github.com/Trec-TorConsulting/entertainment-express
bench --site <site> install-app entertainment_express
```

Tenant UI (not Desk): `/owner`, `/employee`, `/client`. Public catalog: `/book` and `/catalog`.
White-label + custom domains: `/owner` Brand workspace (kit, domains, style matcher).

## Spec

See `openspec/` at the workspace root. Start with `openspec/project.md`. There are **42** baseline
capability specs; implementation phases **0–39** are archived under `openspec/changes/archive/`.
