# APEX DC — Enterprise Document Control & Project Management Hub

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-navy?style=for-the-badge)]()

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falyketkat93-create%2FAPEX-DC)

> 🌐 **Live Public Demo:** [https://c74cafc2b86d2d.lhr.life](https://c74cafc2b86d2d.lhr.life)  
> 📦 **GitHub Repository:** [https://github.com/alyketkat93-create/APEX-DC](https://github.com/alyketkat93-create/APEX-DC)

**APEX DC** is an enterprise-grade SaaS platform built specifically for mega construction projects, general contractors, MEP contractors, engineering consultants, and project management offices (PMOs). It manages the entire project documentation lifecycle with strict revision control, 8-point contractual date tracking, SLA compliance, cross-module document linking, and immutable audit trails.

---

## Key Modules & Capabilities

### 1. Unified Drawings & Document Submissions
* Merged drawing registers, shop drawings, revisions, formal transmittals, and consultant review workflows into one unified module.
* Tracks drawing numbering according to project standards with non-destructive revision history (P01, P02, 00, 01...).
* Automatically links formal transmittals without auto-approving documents.

### 2. Universal Document Links & Cloud References
* Replaces local file uploads with a universal **Documents & References** engine.
* Connects directly to external cloud document repositories:
  * **Microsoft SharePoint & OneDrive**
  * **Autodesk Construction Cloud (ACC) & BIM 360**
  * **Google Drive & Workspace**
  * **Oracle Aconex & Procore**
  * Any secure enterprise `https://` document URL.
* Preserves legacy attachments in a read-only archive while disabling local file uploads.
* **Cross-Module APEX Record Linking:** Link approved drawings to IRs, submittals to RFIs, or transmittals to letters without duplicating records in target registers.

### 3. Post-Save Date Corrections & 8-Point Lifecycle Tracking
* Mandatory 8-point lifecycle dates across every document type:
  1. **Preparation Date**
  2. **Internal Review Date**
  3. **Submission / Sending Date**
  4. **Consultant Receipt Date**
  5. **Consultant Review / Response Date**
  6. **Official Approval Date**
  7. **Revision Date**
  8. **Closure Date**
* **Editable Dates After Saving:** Authorized document controllers can adjust dates at any time without creating duplicate records.
* **Mandatory Technical Reason Enforcement:** Modifying official contractual dates requires a documented technical/contractual reason, recorded in the audit trail.
* **Strict Workflow Invariant:** Editing a date or link **never** prematurely mutates document approval status (`reviewStatus`).

### 4. Technical Submittals & Material Approvals
* Tracks Material Submittals, Equipment Submittals, Pre-qualification Submittals, and Samples.
* Consultant review codes (Code A, Code B, Code C, Code D) with turnaround SLA countdowns.

### 5. Inspection Requests (IR / WIR) & Material Inspections (MIR)
* Work Inspection Requests (WIR) and Material Inspection Requests (MIR) with site location, building, and floor level.
* Reinspection linking upon rejection and direct NCR generation for non-compliant deliveries.

### 6. Quality Assurance & Non-Conformance (NCR / CAR)
* Defect documentation, root cause analysis, corrective action plans (CAP), and closeout verification.

### 7. Contractual Correspondence & RFIs
* Inbound and outbound official letter registers with response deadlines.
* Requests for Information (RFI) with cost and schedule impact indicators.

### 8. As-Built Documentation & Handover Dossier
* Closeout tracking for As-Built drawings, O&M manuals, warranty certificates, and testing & commissioning reports.

### 9. Master Document Register (MDR)
* Consolidated enterprise view of all project documentation with global search, discipline filtering, and Excel export.

### 10. No-Code Dynamic Custom Module Builder
* Create new custom modules and registers on the fly with configurable fields, numbering prefixes, and workflow statuses.

### 11. Bilingual English & Arabic Support
* Full native bilingual support with seamless RTL (Right-to-Left) and LTR (Left-to-Right) layout switching.

---

## Tech Stack

* **Frontend & Backend Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Spreadsheets & Data Export:** [SheetJS (xlsx)](https://sheetjs.com/)
* **Database & Persistence:** Real JSON file storage in `data/storage/` with atomic writes, revision history, and immutable audit logging.

---

## Getting Started

### Prerequisites
* Node.js 18.x or later
* Git

### Installation

```bash
# Clone the repository
git clone https://github.com/alyketkat93-create/APEX-DC.git

# Navigate to the project directory
cd APEX-DC

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the production bundle
npm run build

# Start the production server
npm run start
```

### Automated Acceptance Verification

Run the built-in 23-point automated acceptance suite:

```bash
# Using curl or browser:
curl http://localhost:3000/api/verify
```

---

## License

Proprietary — Developed for Enterprise Document Control & Project Management.
