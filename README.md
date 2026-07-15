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

## 📖 Table of Contents
1. [What is IntelliLoad?](#-what-is-intelliload)
2. [Core Features](#-core-features)
3. [System Architecture](#%EF%B8%8F-system-architecture)
4. [ML Pipeline & Analytics Engine](#-ml-pipeline--analytics-engine)
5. [Installation & Setup](#-installation--setup)
6. [Operation & Usage Guide](#-operation--usage-guide)
7. [API Documentation](#-api-documentation)
8. [Example AI Diagnostic Report](#-example-ai-diagnostic-report)
9. [Roadmap](#%EF%B8%8F-roadmap)
10. [License & Contributing](#-license--contributing)

---

## 🌟 What is IntelliLoad?

IntelliLoad is **not** just another load-testing tool. It sits at the intersection of **Performance Engineering**, **Observability**, **Predictive Analytics**, and **Reliability Engineering** — combining them into a single, intelligent platform.

Traditional load testing tells you:
> _"Current latency = 120ms at 200 users."_

**IntelliLoad** tells you:
> _"Current stable capacity ≈ 420 users. Predicted failure threshold ≈ 560 users. Risk level: Medium. Root cause: Latency degradation contributing 62%."_

It goes beyond measuring — it **understands**, **predicts**, and **recommends**.

---

## ⚡ Core Features

### 1. AI-Driven Adaptive Load Testing
- High-concurrency load generation powered by **Autocannon**.
- Dynamically scales connections based on ML Advisor feedback rather than following static, flat connection ramps (e.g. progressive ramping maps automatically from `10 → 40 → 80 → 150 → 260` concurrent virtual users).
- Real-time safety thresholds automatically abort testing if latency (> 3000ms) or error rate (> 10%) thresholds are violated.

### 2. AI Root Cause Classifier
- Scores performance limits across five distinct dimensions: **Database**, **CPU**, **Memory**, **Network**, and **Application**.
- Isolates event-loop blockages, lock contentions, heap limitations, or socket descriptor saturation.
- Returns a normalized probability distribution representing confidence attributions for each resource constraint.

### 3. Failure Prediction & Anomaly Detection
- Performs real-time anomaly detection using an ensemble of **Isolation Forest** and **One-Class SVM** models.
- Employs a **3-Phase Failure Predictor** that progresses from rules to anomaly scores to supervised **XGBoost** classification as the database collects historical runs.

### 4. Postman Collection Import
- Supports importing Postman Collection (v2/v2.1) JSON files directly.
- Maps endpoints, headers, variables, and body configurations sequentially into testing workflows with dynamic parameter extraction.

### 5. Side-by-Side Run Comparison
- Compares latency curves, throughput variations, error rates, and configurations for any two historical runs.
- Offers interactive timeline overlays to isolate regressions or improvements introduced between deployments.

---

## 🏗️ System Architecture

IntelliLoad utilizes a microservices architecture to segregate high-performance load generation, persistent telemetry logging, and model inference.

```
                  ┌────────────────────────────────────────┐
                  │          IntelliLoad Platform          │
                  │                                        │
                  │   ┌─────────────┐     SSE Stream       │
                  │   │   Frontend  │◄─────────────────┐   │
                  │   │  React/Vite │                  │   │
                  │   │  :5173      │                  │   │
                  │   └──────┬──────┘                  │   │
                  │          │ 1. Configure & Run      │   │
                  │          ▼                         │   │
                  │   ┌─────────────┐ 7. Queue Job ┌───┴──┐│
                  │   │   Backend   ├─────────────►│Worker││
                  │   │Node/Express │              │BullMQ││
                  │   │   :3001     │◄─────────────┤:3001 ││
                  │   └────┬───┬────┘ 9. Save      └──────┘│
                  │        │   │      Telemetry            │
                  │        │   └─────────────┐             │
                  │        ▼                 ▼             │
                  │   ┌─────────────┐ ┌─────────────┐      │
                  │   │   MongoDB   │ │    Redis    │      │
                  │   │ Persistence │ │  Broker &   │      │
                  │   │  :27017     │ │  Job Queue  │      │
                  │   └─────────────┘ │  :6379      │      │
                  │                   └──────┬──────┘      │
                  │                          │             │
                  │                          ▼             │
                  │                   ┌─────────────┐      │
                  │ 8. Fetch Telemetry│ ML Service  │      │
                  │ ─────────────────►│ FastAPI/Py  │      │
                  │                   │ XGBoost/Sk  │      │
                  │ ┌─────────────┐   │ :8000       │      │
                  │ │  InfluxDB   │◄──┴─────────────┘      │
                  │ │ TimeSeries  │                        │
                  │ │  :8086      │◄───────────────────────┘
                  │ └─────────────┘   2. Telemetry Log
```

### Component Details
| Component | Technology Stack | Role |
| :--- | :--- | :--- |
| **Frontend Dashboard** | React 18, Vite, Recharts, Framer Motion | High-fidelity dashboard visualizing real-time telemetry graphs, comparisons, and AI recommendations. |
| **Backend API** | Node.js, Express, Autocannon | Test orchestrator, SSE emitter, collection controller, and database link. |
| **ML Service** | Python 3.11, FastAPI, XGBoost, scikit-learn | Houses anomaly detection (Isolation Forest/SVM), root-cause scoring, and load-advising heuristics. |
| **TimeSeries Database** | InfluxDB v2.7 | Captures high-resolution, millisecond-precision performance ticks. |
| **Persistence Database** | MongoDB | Stores user configurations, Postman collections, and historical analysis reports. |
| **Job Queue & Cache** | Redis, BullMQ | Brokers asynchronous tasks for the background ML analytics pipeline. |
| **Mock Target Server** | Express | Simulates complex bottlenecks (DB locks, CPU limits, timeout plateaus) to validate testing. |

---

## 🧠 ML Pipeline & Analytics Engine

The ML Service acts as the brain of IntelliLoad, operating across three core analytical components:

### 1. The 3-Phase Failure Predictor
To maintain accurate risk forecasting as the platform gathers historical test data, it executes a three-phase model lifecycle:
* **Phase A: Heuristic Rules (0 to 5 runs)**: Relies on weighted statistical boundaries tracking latency spikes, error cliffs, and user counts.
* **Phase B: Anomaly Score Proxy (5 to 50 runs)**: Leverages the decision function scores from trained **Isolation Forest** and **One-Class SVM** models to establish failure probability curves.
* **Phase C: Supervised XGBoost (50+ runs)**: Fits a supervised binary classification model using historic latency, throughput, user count, and error trends to output risk scores.

### 2. Root Cause Classifier Heuristics
Bottlenecks are classified using mathematical indicators and curve-fitting algorithms:
* **Database**: High tail latency ratio ($p95 / \text{avg} > 3.0$) and exponential latency curves fitted using least-squares regressions.
* **CPU**: Linear latency curves combined with throughput plateaus (concurrency increases but throughput remains flat).
* **Memory**: High latency volatility (coefficient of variation $> 0.4$) signaling garbage collection sweeps or memory leaks.
* **Network**: High timeouts and high latency bounds ($p95 / \text{avg} > 8.0$) but stable throughput.
* **Application**: Elevated HTTP 5xx responses that are not bound to socket capacity cliffs or database locks.

### 3. Load Tuning Advisor
Uses the risk output, primary bottleneck classification, and latency indicators to output system directives (`SCALE_UP`, `HOLD`, `SCALE_DOWN`) and dynamic connection targets.

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (including Docker Compose)
* [Node.js v18+](https://nodejs.org/) (if running services individually without Docker)
* [Python 3.11](https://www.python.org/) (if running ML service individually without Docker)

### Option A: Running with Docker Compose (Recommended)
The easiest way to spin up the entire multi-service infrastructure is using Docker Compose:

1. Clone this repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Dev-hub05/IntelliLoad.git
   cd IntelliLoad
   ```
2. Build and run all services in the background:
   ```bash
   docker compose up --build -d
   ```
3. Verify that the containers are healthy:
   ```bash
   docker compose ps
   ```
4. Access the applications:
   * **Frontend Dashboard**: `http://localhost:5173`
   * **Backend API Gateway**: `http://localhost:3001`
   * **ML Analytics Engine**: `http://localhost:8000`
   * **Mock target API**: `http://localhost:3002`

### Option B: Local Manual Setup (For Development)

#### 1. Databases (MongoDB, InfluxDB, Redis)
Start these services locally or using docker images:
```bash
docker run -d -p 27017:27017 --name mongo-local mongo:7.0
docker run -d -p 6379:6379 --name redis-local redis:7-alpine
docker run -d -p 8086:8086 --name influx-local -e DOCKER_INFLUXDB_INIT_MODE=setup -e DOCKER_INFLUXDB_INIT_USERNAME=admin -e DOCKER_INFLUXDB_INIT_PASSWORD=intelliload -e DOCKER_INFLUXDB_INIT_ORG=intelliload -e DOCKER_INFLUXDB_INIT_BUCKET=metrics -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=intelliload-dev-token influxdb:2.7
```

#### 2. ML Service Setup
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

#### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 5. Target Mock Server Setup
```bash
cd test-server
npm install
node server.js
```

---

## 🎮 Operation & Usage Guide

### 1. Setting up and Running a Test Run
1. Open the Dashboard at `http://localhost:5173`.
2. Navigate to the **Configure Test** page.
3. Input target details:
   - **Target URL**: `http://localhost:3002/api/data` (to target the mock server)
   - **Method**: `GET`
   - **Load Profile**: Choose `Steady` or `Ramp` (for static tests).
   - **Virtual Users**: Set connections (e.g. `20`) and **Duration** (e.g., `30` seconds).
4. Click **Run Test**. The UI will open the live telemetry screen and stream metrics (latency curves, throughput, errors) in real time.

### 2. Triggering AI-Driven Adaptive Load Testing
1. Navigate to the **Stress Test Runner** page.
2. Enter the target URL (e.g., `http://localhost:3002/api/checkout`).
3. Click **Start Adaptive Stress Test**.
4. The backend runner will automatically boot the initial load step at `10` virtual users.
5. Watch the dashboard: at the end of each 10-second step, the test runner will call the ML Advisor and dynamically adjust the concurrency (e.g., ramping to `40`, `80`, `150`, or `260` VUs) depending on system health.
6. The test auto-terminates the moment the ML service flags a `SCALE_DOWN` suggestion or when error thresholds are breached.

### 3. Importing Postman Collections
1. Go to the **Collections** tab.
2. Click **Import Postman** on the top right.
3. Paste the raw JSON of a Postman Collection (v2/v2.1) export.
4. Click **Import**. The endpoints will list in the panel.
5. Click **Run Collection** to execute tests sequentially against all endpoints, with parameter extraction mapping variables automatically between subsequent requests.

### 4. Running Comparisons
1. Navigate to the **Comparison Matrix** tab.
2. Choose two historical runs from the drop-down selectors.
3. Inspect the comparative delta cards showing regressions or enhancements (e.g. `+18% Throughput`, `-22% Latency`).
4. Review the timeline chart overlays to isolate exact regressions.

---

## 🔌 API Documentation

### Backend Gateway Endpoints (`:3001`)

#### `POST /api/tests`
Starts a load test.
* **Payload**:
  ```json
  {
    "name": "Production Checkout Test",
    "targetUrl": "http://localhost:3002/api/checkout",
    "method": "POST",
    "body": "{\"item\": \"item_123\"}",
    "config": {
      "connections": 20,
      "duration": 30,
      "pattern": "steady" // Set to 'autonomous' for adaptive tests
    }
  }
  ```
* **Response**: Status `201 CREATED` with test metadata and initial `running` status.

#### `GET /api/tests`
Retrieves a paginated list of historical runs.

#### `POST /api/tests/:id/stop`
Forces a running test instance to stop.

#### `GET /api/tests/:id/metrics`
Queries InfluxDB metrics telemetry for a completed run.

#### `POST /api/collections/import`
Imports a Postman Collection JSON schema.

---

### Python ML Service Endpoints (`:8000`)

#### `POST /ml/anomaly/detect-batch`
Identifies statistical outliers inside a test execution time-series dataset.

#### `POST /ml/predict/failure`
Evaluates telemetry vectors against XGBoost classifiers to calculate failure probability.
* **Payload**:
  ```json
  {
    "test_run_id": "647f2b963b2f9011ab738e4a",
    "current_metrics": {
      "avg_latency": 150.5,
      "p95_latency": 450.2,
      "throughput": 120.0,
      "error_rate": 0.5,
      "active_users": 40.0
    },
    "historical_runs_count": 62
  }
  ```
* **Response**:
  ```json
  {
    "failure_probability": 0.08,
    "risk_level": "LOW",
    "model_phase": "Phase C: Supervised XGBoost",
    "contributing_factors": [
      { "feature": "p95_latency", "importance": 0.42 },
      { "feature": "error_rate", "importance": 0.35 }
    ]
  }
  ```

#### `POST /ml/root-cause/score`
Fits curves and checks volatility ratios to output root-cause scoring distributions.

#### `POST /ml/advisor/recommend`
Translates risk scores and bottleneck attributions into system commands and connection targets.

---

## 📊 Example AI Diagnostic Report

Below is an example of an AI Diagnostic Report generated by the ML pipeline after testing a target API experiencing high connection loads:

```yaml
---
Test Run: Checkout Endpoint Stress Test (ID: 647f2b963b2f9011ab738e4a)
Status: Completed (Breaking Point Encountered)
---

Risk Assessment:
  Risk Level: CRITICAL
  Failure Probability: 92.0%
  Modeling Phase: Phase C (Supervised XGBoost)

Bottlenecks Root Cause Attribution:
  Application: 54% (Primary Cause)
  Database: 22%
  CPU: 14%
  Memory: 8%
  Network: 2%

Diagnostics:
  "High confidence (54%) of application-level errors or runtime bottlenecks. 
  Unhandled exceptions or route controller blockage detected."

ML Advisor Recommendations:
  Recommendation: SCALE_DOWN
  Suggested Connections: 182 VUs (Reduced from 260 VUs)
  Tuning Actions:
    1. Optimize application code logic and event loop blocks.
    2. Verify error handling middleware response codes.
    3. Review server-side stack trace logs to resolve exception paths.
```

---

## 🗺️ Roadmap

Future enhancements and architectural targets planned for IntelliLoad:

- [ ] **Distributed Load Generators**: Scale Autocannon load nodes horizontally across multiple Kubernetes pods to support high-scale stress testing ($>100k$ concurrent VUs).
- [ ] **Auto-Tuning Gateways**: Auto-inject suggested ML connections directly into API Gateways (e.g. Kong, Envoy) to enforce automated rate-limiting guards during traffic peaks.
- [ ] **SaaS Tenant isolation**: Implement Multi-tenancy to securely segregate workspaces, historical test runs, and user credentials.
- [ ] **CI/CD Integration Action**: Publish a GitHub Action to automatically trigger comparative tests on pull requests and fail builds on regression alerts.
- [ ] **Extended Protocol Support**: Support load testing for **gRPC**, **GraphQL**, and **WebSockets** endpoints.

---

## 📝 License & Contributing

Distributed under the MIT License. See `LICENSE` for more information.

Contributions are welcome! Please open an issue or submit a pull request with any improvements.
