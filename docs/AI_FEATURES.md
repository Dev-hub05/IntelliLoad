# IntelliLoad AI Features Documentation

This document describes the design and inner workings of the AI-powered features in the IntelliLoad platform.

---

## 1. AI-Driven Adaptive Load Testing

Unlike traditional load generators that rely on static step-ramping arrays (e.g., `10 -> 25 -> 50 -> 100`), IntelliLoad's stress runner performs dynamic, real-time load adjustment driven by the ML Load Advisor.

### How it works:
1. **Initial Step**: The test begins at a baseline of `10` virtual users.
2. **Telemetry Evaluation**: At the end of each step, the backend metrics collector aggregates latency (average, p95), throughput, and error rates.
3. **ML Advisor Inference**: The runner queries the FastAPI ML service's `/ml/advisor/recommend` endpoint with the current step telemetry and failure risk predictions.
4. **Dynamic Ramping**:
   - **SCALE_UP**: Ramps VUs progressively following a non-linear curve (`10 -> 40 -> 80 -> 150 -> 260` VUs).
   - **SCALE_DOWN**: Decreases VUs by 30% to stabilize the service.
   - **HOLD**: Maintains the current load to monitor stability.
5. **Early Termination**: Ramping terminates immediately if the advisor flags a `SCALE_DOWN` status or if health safety thresholds (e.g., error rate > 10%) are crossed.

---

## 2. AI Root Cause Classifier

The ML Root Cause Scorer evaluates performance signatures to attribute bottlenecks across 5 key dimensions:

| Resource Dimension | Performance Signature | Recommended Action Example |
| :--- | :--- | :--- |
| **Database** | Exponential latency growth + high tail latency ratios | Index optimization, query caching |
| **CPU** | Linear latency growth + flat throughput | Horizontal scaling, code profiling |
| **Memory** | High latency variance (indicates GC sweeps) | Heap tuning, leak profiling |
| **Network** | High timeouts or extremely high p95/avg latency ratios | Payload compression, CDN optimization |
| **Application** | High error rates not bound to socket capacity limits | Logic refactoring, middleware tuning |

Confidence scores are returned as a probability distribution summing to `1.0`.

---

## 3. Postman Collection Import

IntelliLoad supports direct import of Postman Collection (v2/v2.1) JSON schemas. Endpoints, headers, query parameters, and raw JSON request bodies are mapped automatically into sequential testing pipelines.
