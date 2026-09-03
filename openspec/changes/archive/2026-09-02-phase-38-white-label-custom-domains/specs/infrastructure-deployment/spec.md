## ADDED Requirements

### Requirement: Custom Domain Ingress And TLS
The system SHALL reconcile verified tenant custom hostnames into Traefik Ingress rules that route `/` to `frappe-python` and `/socket.io` to `frappe-socketio`, and SHALL obtain TLS certificates for those hostnames (HTTP-01) without requiring a manual kubectl edit per domain.

#### Scenario: Verified host gets a cert
- **WHEN** the control plane records a verified custom hostname
- **THEN** within one reconciler interval the Ingress includes that host and TLS becomes active (or tls_status surfaces an actionable error)

#### Scenario: Unverified host not routed
- **WHEN** a hostname is requested but not verified
- **THEN** it is not added to the live custom-domain Ingress
