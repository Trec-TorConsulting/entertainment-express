# Security Policy

Entertainment Express is a proprietary, multi-tenant SaaS platform. We take the
security and isolation of every tenant's data seriously and appreciate
responsible disclosure.

## Supported versions

This repository tracks the actively developed line of the platform. Only the
latest `main` (and the currently deployed production image) receives security
fixes.

| Version            | Supported          |
| ------------------ | ------------------ |
| `main` (latest)    | :white_check_mark: |
| Older commits/tags | :x:                |

## Reporting a vulnerability

**Do not open a public issue, discussion, or pull request for security
problems.** Public disclosure before a fix puts every tenant at risk.

Instead, report privately using either channel:

1. **GitHub Security Advisories (preferred)** —
   [Report a vulnerability »](https://github.com/Trec-TorConsulting/entertainment-express/security/advisories/new)
   This opens a private advisory visible only to the maintainer.
2. **Email** — [tobey@trec-tor.com](mailto:tobey@trec-tor.com) with the subject
   line `SECURITY: entertainment-express`.

Please include, where possible:

- A clear description of the issue and its impact (e.g. cross-tenant data access,
  authentication/authorization bypass, RCE, secret exposure).
- Steps to reproduce or a proof of concept.
- Affected component (control plane, API, a specific doctype, a client app,
  deployment/infra) and version / image tag.
- Any suggested remediation.

## What to expect

- **Acknowledgement:** within 3 business days.
- **Assessment & triage:** we will confirm the report, determine severity, and
  keep you updated on remediation progress.
- **Disclosure:** fixes are developed privately and released before any public
  detail is shared. We are happy to credit reporters who wish to be named.

## Scope

In scope: the `entertainment_express` application, the client apps under
`frontend/`, the container image build, and deployment manifests in this
repository.

Out of scope: vulnerabilities in upstream projects (Frappe, ERPNext, MariaDB,
Redis, Kubernetes, etc.) — please report those to their respective maintainers —
and issues that require privileged access already granted by a tenant.

## Handling of secrets

No credentials, API keys, or secrets should ever appear in this repository.
Secret-scanning **push protection** is enabled. If you believe a secret was
committed, treat it as an incident and report it privately using the channels
above so it can be rotated.
