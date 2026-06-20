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
