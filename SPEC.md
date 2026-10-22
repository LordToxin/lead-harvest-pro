# SPEC: LeadHarvest Pro — B2B Lead Finder & CRM Sync (Chrome Extension MV3)

## 1. Overview
**LeadHarvest Pro** is a high-performance, zero-dependency browser extension built under Google's Manifest V3 specifications. It automates B2B contact and profile extraction across social business platforms (LinkedIn, GitHub, Twitter/X) and generic websites, enabling sales reps, recruiters, and agency growth consultants to capture leads and export directly to CSV (RFC 4180 / UTF-8-BOM) or sync via real-time HTTP webhooks to modern CRMs (HubSpot, Notion, Zapier, Make.com, n8n).

## 2. Technical Architecture
- **Platform**: Chrome Extension Manifest V3 (Google Web Store compliant).
- **Core Engine**: Pure vanilla JavaScript (ES2024), zero external runtime libraries.
- **Components**:
  - `manifest.json`: Defines permissions (`activeTab`, `storage`, `scripting`), background service worker, host permissions, action popup, and content script injection.
  - `scripts/background.js`: Service worker managing duplicate checking, badge counters, and secure storage lifecycle.
  - `scripts/extractor.js`: DOM extraction logic for profile cards and metadata across LinkedIn and GitHub with regex email and phone detectors.
  - `scripts/floating-widget.js`: High-contrast in-page floating quick-capture widget with unobtrusive UI.
  - `popup/`: Tabbed interface (`Capture`, `Saved Leads`, `Settings`) for searching, filtering, editing, and dispatching webhook payloads.
- **Testing**: Built-in automated test runner (`test-runner.js`) verifying DOM regex matchers, sanitization, and CSV formatting.
- **Distribution Packaging**: Automated build script (`package-extension.js`) generating release-ready `.zip` archives.

## 3. Monetization Strategy
- **Turnkey Digital Asset (Gumroad / LemonSqueezy / AppSumo)**: $29–$49 lifetime license for sales reps seeking a subscription-free lead scraper.
- **Chrome Web Store In-App Subscription (ExtensionPay)**: Freemium model (25 free leads, $9.99/mo unlimited tier).
- **White-Label Agency Deployments**: Custom branded extension for lead gen agencies at $300–$600 per license.
