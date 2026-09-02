## ADDED Requirements

### Requirement: Ollama On The GPU Node
The system SHALL run Ollama in namespace `entertainment-express` scheduled only on node05 with the `gpu-only` toleration. Frappe bench pods SHALL continue to exclude node05.

#### Scenario: GPU isolation
- **WHEN** the Ollama Deployment is applied
- **THEN** it targets node05 with `gpu-only:NoSchedule` toleration, and frappe-python node affinity still NotIn node05
