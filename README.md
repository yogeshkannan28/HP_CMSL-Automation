# 🏗️ HP CMSL Test Automation Framework

Automated testing framework for **HP Client Management Script Library (CMSL)** PowerShell modules, built with **JavaScript + Jest** using the **POM (Page Object Model)** pattern adapted for CLI automation.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Modules Covered](#modules-covered)
- [CI/CD Setup](#cicd-setup)
- [Contributing](#contributing)

---

## 🏛️ Architecture

```
Test File  →  Module Class (POM)  →  psRunner  →  pwsh.exe  →  HP CMSL
              "builds the command"    "executes"              "actual cmdlet"
```

### Three-Layer Design

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Tests** | `tests/` | Pure assertions — no PowerShell knowledge |
| **POM Modules** | `src/modules/` | Command builders — one class per HP module |
| **Engine** | `src/helpers/` | PS execution, platform guards, reporting |

> **Why POM for CLI?** Same principle as UI POM — if HP changes a cmdlet name, you fix it in **one file** (the module), not across every test.

---

## ✅ Prerequisites

| Requirement | Details |
|-------------|---------|
| **OS** | Windows 10 or Windows 11 |
| **Hardware** | HP device (required for most CMSL commands) |
| **HP CMSL** | Installed via: `Install-Module -Name HPCMSL -Force -AcceptLicense` |
| **PowerShell** | PS 7+ (pwsh.exe) preferred; PS 5.1 as fallback |
| **Node.js** | v18+ (recommended: v20 LTS) |
| **Privileges** | ⚠️ Must run as **Administrator** |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yogeshkannan28/hp-cmsl-automation.git
cd hp-cmsl-automation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run pre-flight checks
```bash
npm run preflight
```
This validates: Windows OS → Admin rights → PowerShell version → CMSL installed.

### 4. Run all tests
```powershell
# ⚠️ Run terminal as Administrator!
npm test
```

---

## 📁 Project Structure

```
hp-cmsl-automation/
│
├── src/
│   ├── helpers/
│   │   ├── psRunner.js          # Core PowerShell execution engine
│   │   ├── platformGuard.js     # Pre-flight environment checks
│   │   ├── globalSetup.js       # Jest global setup hook
│   │   └── jsonReporter.js      # Custom JSON test reporter
│   │
│   └── modules/                 # POM Layer — one class per HP module
│       ├── BiosDevice.js        # BIOS & Device Management
│       ├── SoftPaqManagement.js # SoftPaq identification & download
│       ├── SoftPaqRepository.js # SoftPaq repository management
│       ├── Firmware.js          # Low-level firmware access
│       ├── Consent.js           # HP Analytics consent management
│       ├── Notifications.js     # Toast notification invocation
│       ├── Docks.js             # Dock info & firmware updates
│       └── Retail.js            # HP Retail systems (Engage Go)
│
├── tests/                       # Test Layer — pure assertions
│   ├── bios-device/
│   │   └── bios-device.test.js
│   ├── softpaq-mgmt/
│   │   └── softpaq-mgmt.test.js
│   ├── softpaq-repo/
│   │   └── softpaq-repo.test.js
│   ├── firmware/
│   │   └── firmware.test.js
│   ├── consent/
│   │   └── consent.test.js
│   ├── notifications/
│   │   └── notifications.test.js
│   ├── docks/
│   │   └── docks.test.js
│   └── retail/
│       └── retail.test.js
│
├── config/
│   └── settings.js              # Central configuration (edit per machine)
│
├── reports/                     # Generated test reports (gitignored)
│
├── .github/
│   └── workflows/
│       └── hp-cmsl-tests.yml    # GitHub Actions CI/CD workflow
│
├── package.json
├── jest.config.js
├── .gitignore
└── README.md
```

---

## 🧪 Running Tests

### Run all modules
```bash
npm test
```

### Run a specific module
```bash
npm run test:bios          # BIOS & Device
npm run test:softpaq       # SoftPaq Management
npm run test:repo          # SoftPaq Repository
npm run test:firmware      # Firmware
npm run test:consent       # Consent / Analytics
npm run test:notifications # Notifications
npm run test:docks         # Docks
npm run test:retail        # Retail
```

### Run with JSON report
```bash
npm run test:report
# Output: reports/test-results.json
```

### Run pre-flight only
```bash
npm run preflight
```

---

## 📦 Modules Covered

| # | Module | POM Class | Test File | HP Module |
|---|--------|-----------|-----------|-----------|
| 1 | BIOS & Device | `BiosDevice.js` | `bios-device.test.js` | HP.ClientManagement |
| 2 | SoftPaq Management | `SoftPaqManagement.js` | `softpaq-mgmt.test.js` | HP.Softpaq |
| 3 | SoftPaq Repository | `SoftPaqRepository.js` | `softpaq-repo.test.js` | HP.Repo |
| 4 | Firmware | `Firmware.js` | `firmware.test.js` | HP.Firmware |
| 5 | Consent | `Consent.js` | `consent.test.js` | HP.Consent |
| 6 | Notifications | `Notifications.js` | `notifications.test.js` | HP.Notifications |
| 7 | Docks | `Docks.js` | `docks.test.js` | HP.Docks |
| 8 | Retail | `Retail.js` | `retail.test.js` | HP.Retail |

---

## 🔄 CI/CD Setup (GitHub Actions + Self-Hosted Runners)

Since HP CMSL requires **real HP hardware**, we use **self-hosted runners** on actual devices.

### Setup per device:

1. **Install the GitHub Actions Runner**
   - Go to: `Settings → Actions → Runners → New self-hosted runner`
   - Download and configure the runner on your HP device

2. **Register with platform labels**
   ```bash
   # During runner config, add labels:
   # For Win 10 device: self-hosted, windows, windows-10
   # For Win 11 device: self-hosted, windows, windows-11
   ```

3. **Run the runner service as Administrator**
   ```powershell
   .\svc.sh install
   .\svc.sh start
   ```

### Trigger options:
- **Auto**: Push to `main` or `develop` branch
- **Manual**: `Actions → HP CMSL Tests → Run workflow` (choose module & platform)

---

## 👤 Author

**Yogesh Kannan** — [@yogeshkannan28](https://github.com/yogeshkannan28)

---

## 📄 License

MIT
