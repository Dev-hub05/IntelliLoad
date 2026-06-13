# IntelliLoad 🚀

**IntelliLoad** is an AI-Powered Adaptive API Performance Testing and Failure Prediction Platform. It is designed to run automated, high-concurrency API performance audits, identify capacity degradation limits, and leverage machine learning to predict failure risks and isolate root causes in real-time.

---

## 🏗️ Architecture Overview

The system is built as a microservices application consisting of:
- **Backend Service (Node.js/Express)**: Manages test run state, schedules background analysis, runs autocannon load-generating tasks, and streams live telemetry via Server-Sent Events (SSE).
- **Frontend Dashboard (React/Vite/Recharts)**: A premium glassmorphism dashboard providing real-time data visualizations, pipeline creation flows, and comparison matrices.
- **AI/ML Service (Python/FastAPI/XGBoost)**: Evaluates timeseries anomaly indexes, predicts failure risk indicators, and computes root-cause attributions.
- **Time-Series Engine (InfluxDB)**: Stores high-resolution metric telemetry for historical analytics.
- **Database & Queue (MongoDB & Redis)**: Manages persistence schemas and routes background job payloads.

---

## ⚡ Core Features (Phase 5 Complete)

### 1. API Collections & Request Chaining
- Group multiple API endpoints into a single testing flow.
- Support for **sequential** or **parallel** execution modes.
- Define dynamic **response extractors** to capture parameters (e.g., token IDs) from response headers/bodies and inject them as `{{variables}}` in subsequent request payloads.
- Native **Postman Collection (v2/v2.1)** import and export support.

### 2. Autonomous Stress Testing & Breaking Point Discovery
- Automated progressive connection ramping loop (`10 -> 25 -> 50 -> 100 -> 150 -> 200 -> 250 -> 300 -> 400 -> 500` virtual users).
- Real-time threshold monitoring (stops execution if error rates exceed 10% or latency exceeds 3000ms).
- Identifies system operational boundaries, failure limits, and issues recommended safe capacity buffers.

### 3. Side-by-Side Run Comparison Dashboard
- Compare configuration details and performance metrics for any two historical runs.
- Visual comparative delta cards highlighting latency, throughput, error rate, and request improvements or regressions.
- Interactive **timeline overlay charts** matching timeseries metrics relatively from the start of each execution.

---

## 🛠️ Quick Start

To launch the entire platform environment using Docker Compose:

```bash
docker-compose up --build
```

### Port Mapping
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:3001](http://localhost:3001)
- **AI/ML Service**: [http://localhost:8000](http://localhost:8000)
- **InfluxDB Dashboard**: [http://localhost:8086](http://localhost:8086)
