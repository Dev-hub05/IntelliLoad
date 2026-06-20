<p align="center">
  <h1 align="center">IntelliLoad 🚀</h1>
  <p align="center">
    <strong>AI-Powered Adaptive API Performance Testing & Failure Prediction Platform</strong>
  </p>
  <p align="center">
    <em>Discover API scalability limits · Predict failures before they happen · Automatically determine safe operating capacity</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/XGBoost-ML-FF6600?logo=xgboost&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## What is IntelliLoad?

IntelliLoad is **not** just another load testing tool. It sits at the intersection of **Performance Engineering**, **Observability**, **Predictive Analytics**, and **Reliability Engineering** — combining them into a single, intelligent platform.

Traditional load testing tells you:

> _"Current latency = 120ms at 200 users."_

**IntelliLoad** tells you:

> _"Current stable capacity ≈ 420 users. Predicted failure threshold ≈ 560 users. Risk level: Medium. Root cause: Latency degradation contributing 62%."_

It goes beyond measuring — it **understands**, **predicts**, and **recommends**.

---

## Why IntelliLoad?

| Capability | Apache JMeter | Locust | k6 | **IntelliLoad** |
|:---|:---:|:---:|:---:|:---:|
| Load Testing | ✅ | ✅ | ✅ | ✅ |
| AI-Powered Analysis | ❌ | ❌ | Partial | ✅ |
| Failure Prediction | ❌ | ❌ | ❌ | ✅ |
| Autonomous Stress Testing | ❌ | ❌ | ❌ | ✅ |
| Root-Cause Attribution | ❌ | ❌ | ❌ | ✅ |
| Capacity Estimation | ❌ | ❌ | ❌ | ✅ |

> **IntelliLoad helps teams discover API scalability limits, predict failures before they happen, and automatically determine safe operating capacity — instead of relying on static load tests.**

---

## 🏗️ Architecture Overview

IntelliLoad is built as a **microservices architecture** with six core components working in concert:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         IntelliLoad Platform                            │
│                                                                         │
│  ┌─────────────┐    SSE Stream    ┌──────────────────┐                  │
│  │   Frontend   │◄───────────────►│   Backend API     │                 │
│  │  React/Vite  │                 │  Node.js/Express  │                 │
│  │  :5173       │                 │  :3001            │                 │
│  └─────────────┘                  └────────┬─────────┘                  │
│                                       │    │    │                        │
│                            ┌──────────┘    │    └──────────┐            │
│                            ▼               ▼               ▼            │
│                    ┌──────────────┐ ┌────────────┐ ┌──────────────┐     │
│                    │   MongoDB    │ │   Redis    │ │  InfluxDB    │     │
│                    │  Persistence │ │  Job Queue │ │  TimeSeries  │     │
│                    │  :27017      │ │  :6379     │ │  :8086       │     │
│                    └──────────────┘ └─────┬──────┘ └──────────────┘     │
│                                           │                             │
│                                    ┌──────▼──────┐                      │
│                                    │  ML Service  │                     │
│                                    │ FastAPI/     │                     │
│                                    │ XGBoost      │                     │
│                                    │ :8000        │                     │
│                                    └─────────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

| Component | Technology | Role |
|:---|:---|:---|
| **Backend API** | Node.js, Express, Autocannon | Orchestrates load tests, manages state, streams live telemetry via SSE |
| **Frontend Dashboard** | React 18, Vite, Recharts, Framer Motion | Premium glassmorphism UI with real-time visualizations and interactive controls |
| **AI/ML Service** | Python 3.11, FastAPI, XGBoost, scikit-learn | Anomaly detection, failure prediction, root-cause attribution, capacity estimation |
| **Database** | MongoDB (Mongoose) | Persistent storage for test configurations, results, and collections |
| **Job Queue** | Redis, BullMQ | Asynchronous background processing for ML analysis tasks |
| **Time-Series Engine** | InfluxDB | High-resolution metric telemetry for historical analytics and trend analysis |

---

## ⚡ Core Features

### 1. Intelligent Load Testing Engine
- High-concurrency API load generation powered by **Autocannon**
- Configurable parameters: connections, duration, pipelining, HTTP method, custom headers, and request bodies
- Captures granular metrics: **latency percentiles** (p50 / p95 / p99), **throughput** (req/sec), **error rates**, and **timeouts**
- Real-time telemetry streaming to the dashboard via **Server-Sent Events (SSE)**

### 2. Autonomous Stress Testing & Breaking Point Discovery
- Automated **progressive connection ramping**: `10 → 25 → 50 → 100 → 150 → 200 → 250 → 300 → 400 → 500` virtual users
- Real-time threshold monitoring — auto-stops if error rate exceeds **10%** or latency exceeds **3000ms**
- Discovers the system's **operational boundaries**, **failure limits**, and issues **recommended safe capacity buffers**
- Few open-source tools offer this capability natively

### 3. AI-Powered Predictive Analytics
- **Anomaly Detection**: Statistical anomaly scoring on latency/throughput/error time-series using z-score and IQR-based methods
- **Failure Risk Prediction**: XGBoost classifier predicts probability of imminent failure; outputs risk score (0–1) and risk level (Low / Medium / High / Critical)
- **Root-Cause Attribution**: Feature importance analysis identifies which metrics contribute most to degradation, with ranked root causes and confidence percentages
- **Capacity Estimation**: Predicts maximum stable user capacity and the failure threshold based on observed performance curves
- **Actionable Recommendations**: Generates context-aware suggestions based on analysis results

### 4. API Collections & Request Chaining
- Group multiple API endpoints into a single testing flow
- Support for **sequential** or **parallel** execution modes
- Define dynamic **response extractors** to capture parameters (e.g., tokens, IDs) from response headers/bodies and inject them as `{{variables}}` into subsequent requests
- Native **Postman Collection (v2/v2.1)** import and export support

### 5. Side-by-Side Run Comparison
- Compare configuration details and performance metrics for any two historical runs
- Visual **comparative delta cards** highlighting latency, throughput, error rate, and request improvements or regressions
- Interactive **timeline overlay charts** matching time-series metrics relative to each execution's start time
- Ideal for **performance regression testing** in CI/CD workflows

### 6. Premium Real-Time Dashboard
- **Glassmorphism UI** with smooth gradient backgrounds and animated cards
- **Framer Motion** micro-animations for enhanced interactivity
- **Recharts** data visualizations: latency charts, throughput charts, breaking point graphs, capacity gauges
- **Lucide React** icon system for clean, modern iconography
- Pages: Dashboard overview, Test Configuration, Live Results, Stress Test Runner, Collections Manager, Comparison Matrix

---

## 🎯 Use Cases & Applications

IntelliLoad is designed to address a wide spectrum of performance engineering challenges, spanning developer local testing to enterprise-level site reliability engineering (SRE).

### 1. API Capacity Planning
* **The Problem:** Companies frequently launch products, APIs, or major marketing campaigns (e.g., promotional sales, registration events) without knowing: *“Can our checkout survive 10,000 concurrent users?”* Traditional load generators only report flat post-run metrics.
* **The IntelliLoad Solution:** IntelliLoad models API performance under progressive loads, calculating exact capacity envelopes in real-time.
  * **Traditional Output:** `Current Latency = 120ms`
  * **IntelliLoad Output:** 
    ```yaml
    Current Capacity: ~420 concurrent users
    Predicted Failure: ~560 concurrent users (95% Confidence)
    Recommended Safe Buffer: 336 users
    ```
* **Target Audience:** SaaS Startups, E-Commerce Platforms, Fintech & Banking APIs, Government Portals.

---

### 2. Pre-Deployment Release Validation (Performance Regression Testing)
* **The Problem:** Teams push new features to production only to discover hours later that version 2 suffers from memory leaks or database locking under load, causing regressions.
* **The IntelliLoad Solution:** Before merging code, developers can execute comparison runs. The delta engine contrasts:
  * **Version A (Production/Baseline)** vs. **Version B (Release Candidate)**
  * Generates an immediate comparative breakdown:
    ```diff
    + 18% Throughput (Requests/Sec)
    - 22% Latency (p95)
    + 0.05% Error Rate Change
    ```
* **Target Audience:** DevOps Teams, QA Engineers, Backend Developers.

---

### 3. AI-Powered SRE (Predictive Reliability Engineering)
* **The Problem:** Standard APM and monitoring tools (Datadog, Prometheus) trigger alerts *after* CPU usage hits 95% or error rates have already spiked, resulting in active downtime.
* **The IntelliLoad Solution:** By analyzing real-time metric streams (latency slope, throughput changes, error rates), IntelliLoad's XGBoost models predict imminent failure *before* it occurs.
  * **Alert Output:** `Failure risk: CRITICAL (92% probability of service degradation within 2 minutes) due to database socket exhaustion.`
* **Target Audience:** Platform Engineers, Site Reliability Engineers (SREs), Infrastructure Teams.

---

### 4. Cloud Cost Optimization (FinOps)
* **The Problem:** Over-provisioning infrastructure leads to massive, unnecessary cloud bills. Engineers often run 12 application nodes when 4 would suffice, simply to "be safe."
* **The IntelliLoad Solution:** IntelliLoad analyzes the API's actual performance curves to determine under-utilization boundaries.
  * **Insight Output:** 
    ```yaml
    Current infrastructure: Supports up to 800 concurrent users
    Observed peak load: 350 concurrent users
    Potential Action: Scale down cluster size by 40% to save up to $1,200/month in idle resources.
    ```
* **Target Audience:** Cloud Architects, FinOps Teams, Engineering Managers.

---

### 5. Autonomous Stress Testing
* **The Problem:** Designing stress tests is tedious. Engineers must manually compute user ramp schedules, configure step intervals, and watch graphs to make sure they don't crash mock databases.
* **The IntelliLoad Solution:** IntelliLoad executes autonomous progressive ramping, monitoring API health at every stage. It automatically stops execution the moment error rates or latency cross safe thresholds, mapping the exact breaking boundary.
  * **Discovered Metrics:**
    * `Stable Operating Limit:` 420 users
    * `Warning Threshold (Degradation Begins):` 500 users
    * `System Failure Boundary (Crash):` 560 users
* **Target Audience:** Automated QA Teams, Performance Engineers.

---

### 6. API Marketplace Validation
* **The Problem:** Third-party APIs (payment gateways, communications, geolocation) claim 99.99% uptime and low latency SLAs, but reality can vary under load.
* **The IntelliLoad Solution:** Run benchmark workflows against vendor APIs to evaluate throughput, latency percentiles under concurrent loads, and failure behavior when rate-limited.
* **Target Audience:** Integration Architects, Third-Party API Providers (Stripe, Twilio, etc.).

---

### 7. Security & DDoS Resilience Testing (Controlled)
* **The Problem:** Security teams need to verify if rate limiters, API gateways, and web application firewalls (WAF) are correctly configured to mitigate traffic spikes.
* **The IntelliLoad Solution:** Emulate different traffic profiles (Steady, Ramp, Spike, Wave, Stress) to evaluate rate-limit triggers and gateway resilience under intense traffic bursts.
* **Target Audience:** DevSecOps, Penetration Testers, Security Architects.

---

### 8. Startup Internal Platform (SaaS Integration)
* **The Problem:** Startups need an easy, low-overhead way to run validation testing without setting up heavy enterprise software.
* **The IntelliLoad Solution:** A streamlined SaaS-like testing pipeline:
  ```
  Connect Target API ➔ Run Adaptive Load Test ➔ View AI Diagnostic Report ➔ Review Recommendations
  ```
* **Target Audience:** Early-stage Startups, Software Development Agencies.

---

### 9. Educational / Research Tool
* **The Problem:** Teaching performance characteristics, concurrency bugs, and ML-based anomaly detection requires complex distributed frameworks that are hard to coordinate.
* **The IntelliLoad Solution:** Use IntelliLoad as a sandbox to demonstrate how database locking, network bottlenecks, and memory leak patterns materialize in charts and trigger ML anomalies.
* **Target Audience:** Computer Science Universities, Performance Researchers.

---

### 10. Internal Developer Tooling (CI/CD Gatekeeping)
* **The Problem:** Developers write code but don't run load tests locally because setting up JMeter/Locust is too complex.
* **The IntelliLoad Solution:** Developers use IntelliLoad right from their IDE or local environment:
  ```
  Code Completed ➔ Deploy to Test Environment ➔ Trigger IntelliLoad ➔ Automatic Approval/Rollback
  ```
* **Target Audience:** Software Engineers, Release Managers.

---

## 🛠️ Technology Stack

IntelliLoad's microservices architecture leverages standard modern technologies optimized for performance, scalability, and speed:

### Frontend (Dashboard UI)
* **React 18 & Vite:** Ultra-fast hot-reloading dev environment and lightweight production bundle.
* **Recharts:** High-performance SVG charting library supporting real-time data streaming (using a 120-point rolling window).
* **Framer Motion:** Micro-animations for high-fidelity interactive elements and transitions.
* **Lucide React & Tailwind-style Glassmorphism CSS:** A clean, modern dark aesthetic with visual depth and glowing status alerts.

### Backend (Orchestration & Generation)
* **Node.js (v18+) & Express:** Single-threaded, event-driven architecture optimized for asynchronous routing and event emission.
* **Autocannon:** A high-concurrency HTTP load generator that is significantly faster than traditional tools (like JMeter or Locust) and consumes minimal CPU.
* **Server-Sent Events (SSE):** Provides a unidirectional, real-time push channel to stream raw ticks directly to the React dashboard.
* **BullMQ & Redis:** A robust, Redis-backed persistent job queue that handles the ML analysis asynchronously to avoid blocking the main server thread.

### AI/ML Service (Analytics & Inference)
* **Python 3.11 & FastAPI:** High-performance async Python backend supporting typed validation via Pydantic schemas.
* **XGBoost & scikit-learn:**
  * **Anomaly Detection:** Ensemble of *Isolation Forest* and *One-Class SVM* models evaluating timeseries drift.
  * **Failure Prediction:** A three-phase progressive system (Rule-based heuristics ➔ Isolation Forest proxy scores ➔ Supervised XGBoost binary classification).
  * **Root Cause Attribution:** Numerical curve-fitting (polyfit) and metric volatility coefficient analyses mapping database locks, network plateaus, CPU/memory pressure, or concurrency limits.

### Infrastructure & Storage
* **MongoDB:** Document store for user test configs, historical runs, and postman API collection schemas.
* **InfluxDB (v2.7):** Time-series database storing nanosecond-precision metrics telemetry.
* **Redis:** Acts as both the BullMQ queue broker and a fast cache for live metrics snapshots.
* **Docker & Docker Compose:** Standardized environments with volume mappings for database persistence and ML model serialization.

---

## 🔄 Platform Workflow

The diagram below details how data flows through IntelliLoad during a typical run:

```
┌──────────────┐          1. Configure & Run          ┌──────────────┐
│  Dashboard   │─────────────────────────────────────►│ Backend API  │
│ (React/Vite) │◄─────────────────────────────────────│  (Express)   │
└──────────────┘          4. SSE Live Stream          └──────┬───────┘
       ▲                                                     │
       │                                                     │ 2. Spawns
       │                                                     ▼
       │  5. Load Report                               ┌──────────────┐
       │                                               │ Autocannon   │
       │                                               │ Load Engine  │
       │                                               └──────┬───────┘
       │                                                      │
       │                                                      │ 3. Push Ticks
       │                                                      ▼
┌──────┴───────┐         7. Trigger Analysis           ┌──────────────┐
│   MongoDB    │◄──────────────────────────────────────│   Metrics    │
│  (Database)  │                                       │  Collector   │
└──────────────┘                                       └──────┬───────┘
       ▲                                                      │
       │ 9. Save Results                                      │ Write Ticks
       │                                                      ▼
┌──────┴───────┐          8. Query Telemetry           ┌──────────────┐
│  ML Service  │─────────────────────────────────────►│  InfluxDB    │
│  (FastAPI)   │                                       │ (TimeSeries) │
└──────────────┘                                       └──────────────┘
```

1. **User Action:** The user configures load parameters or imports a Postman collection, then clicks **Run**.
2. **Orchestration:** The Backend API initializes the test state and instantiates `autocannon`.
3. **Telemetry Collection:** As traffic runs, the `MetricsCollector` captures throughput, latency percentiles, and errors.
4. **Real-Time Stream:** These metrics are pushed instantly to the user's dashboard via Server-Sent Events (SSE) and written into InfluxDB.
5. **Autocannon Completion:** Once the test duration completes, autocannon yields a final summary structure which is saved to MongoDB.
6. **ML Pipeline:** The backend schedules an asynchronous job on Redis (BullMQ).
7. **ML Inference:** The background worker triggers the FastAPI ML Service, which queries the timeseries data from InfluxDB.
8. **Results Persistence:** The ML models detect anomalies, predict failure probability, isolate root causes, and write the insights back to MongoDB.
9. **UI Update:** The dashboard is notified of completion, displaying the interactive AI Diagnostic Panel with tailored recommendations.

---

## ⚡ Quick Start

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Launching the Platform

To build and launch all services (Frontend, Backend, ML, MongoDB, Redis, InfluxDB, and a mock test server):

```bash
docker-compose up --build
```

For a hot-reloaded development environment using volume mounts:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Port Mapping

Once the services are active, you can access them at:

| Service | Address |
|:---|:---|
| **Frontend Dashboard** | [http://localhost:5173](http://localhost:5173) |
| **Backend API Server** | [http://localhost:3001](http://localhost:3001) |
| **AI/ML Service** | [http://localhost:8000](http://localhost:8000) |
| **InfluxDB UI** | [http://localhost:8086](http://localhost:8086) |
| **Mock Test Server** | [http://localhost:3002](http://localhost:3002) |

---

## 📝 License & Contributing

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Contributions are welcome! Please open an issue or submit a pull request with any improvements.

---


