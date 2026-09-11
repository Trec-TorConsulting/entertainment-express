# Capability: Vendor & Partner Network

## ADDED Requirements

### Requirement: Subcontractor Rate Sheets and Payment Terms
The system SHALL support maintaining default rate sheets, negotiated payout tiers, and payment terms (e.g. Net 15, Net 30, Due upon completion) per subcontractor vendor.

#### Scenario: Configure default payout terms
- **WHEN** an owner configures default payment terms on a subcontractor vendor profile
- **THEN** subsequent job sub-out offers to this vendor automatically pre-fill with their agreed terms

### Requirement: Subcontractor Compliance Gating
The system SHALL verify active Certificate of Insurance (COI) and W-9 records when subbing out jobs, warning the owner if compliance documents are missing or expired.

#### Scenario: Warning on expired subcontractor COI
- **WHEN** an owner attempts to assign a subbed job to a vendor whose COI has expired
- **THEN** the system displays a prominent compliance warning banner requiring explicit owner acknowledgment before issuing the offer
