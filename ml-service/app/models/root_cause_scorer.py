import numpy as np
import pandas as pd

class RootCauseScorer:
    def fit_curve(self, x: np.ndarray, y: np.ndarray) -> str:
        """
        Fits a line or exponential curve to coordinates to verify contention patterns.
        """
        if len(x) < 5:
            return 'linear'

        try:
            # Clean zero values to avoid log(0) errors
            x_clean = np.where(x == 0, 1, x)
            y_clean = np.where(y == 0, 1, y)
            
            # Linear Fit: y = ax + b
            lin_coeffs = np.polyfit(x_clean, y_clean, 1)
            lin_fit = np.polyval(lin_coeffs, x_clean)
            lin_residual = np.sum((y_clean - lin_fit) ** 2)

            # Exponential Fit: log(y) = ax + b -> y = e^b * e^(ax)
            log_y = np.log(y_clean)
            exp_coeffs = np.polyfit(x_clean, log_y, 1)
            exp_fit = np.exp(np.polyval(exp_coeffs, x_clean))
            exp_residual = np.sum((y_clean - exp_fit) ** 2)

            if exp_residual < lin_residual:
                return 'exponential'
            return 'linear'
        except Exception:
            return 'linear'

    def score(self, metrics_history: list) -> dict:
        """
        Attributes probabilistic root cause scores based on performance signals.
        """
        scores = {
            'database': 0.0,
            'network': 0.0,
            'cpu': 0.0,
            'memory': 0.0,
            'concurrency': 0.0
        }

        if len(metrics_history) < 5:
            return {
                "scores": scores,
                "primary_cause": "none",
                "confidence": 0.0,
                "explanation": "Insufficient data to score root cause.",
                "recommendations": ["Run a longer load test to capture performance trends."]
            }

        df = pd.DataFrame(metrics_history)
        
        # Extrapolate signals
        active_users = df['activeUsers'].values
        avg_latency = df['avgLatency'].values
        throughput = df['throughput'].values
        error_rate = df['errorRate'].values

        # 1. Fit latency curve pattern
        curve_type = self.fit_curve(active_users, avg_latency)

        # 2. Extract specific patterns
        # p95/avg latency ratio (Very high tail ratios indicate DB locks or cache misses)
        p95_avg_ratio = 1.0
        if 'p95Latency' in df.columns:
            p95_avg_ratio = df['p95Latency'].mean() / max(df['avgLatency'].mean(), 1.0)

        # Throughput plateau checks
        # Latency increases while throughput stays flat/plateaus
        lat_diff = avg_latency[-1] - avg_latency[0]
        tp_diff = throughput[-1] - throughput[0]
        tp_plateau = (lat_diff > 100) and (abs(tp_diff) < 10)

        # Volatility check (High variance suggests memory pressure or GC sweeps)
        latency_std = np.std(avg_latency)
        latency_mean = np.mean(avg_latency)
        coefficient_of_variation = latency_std / max(latency_mean, 1.0)

        # Concurrency cliff check (Sudden spike in errors)
        err_diff = error_rate[-1] - error_rate[0]
        sudden_error_cliff = err_diff > 15

        # 3. Calculate Scores
        # DB: Exponential latency curves + high tail ratios
        if curve_type == 'exponential':
            scores['database'] += 0.4
        if p95_avg_ratio > 3.0:
            scores['database'] += 0.3
        
        # Network: High timeout trends
        if 'timeout' in df.columns or p95_avg_ratio > 8.0:
            scores['network'] += 0.4
            
        # CPU: Linear curves + throughput plateaus
        if curve_type == 'linear' and tp_plateau:
            scores['cpu'] += 0.5
        elif curve_type == 'linear':
            scores['cpu'] += 0.2

        # Memory: High latency variance (GC pauses)
        if coefficient_of_variation > 0.4:
            scores['memory'] += 0.4
            
        # Concurrency: Sudden cliffs or errors at specific VU thresholds
        if sudden_error_cliff:
            scores['concurrency'] += 0.5

        # Normalize scores to sum to 1.0
        total = sum(scores.values())
        if total > 0:
            scores = {k: round(v / total, 2) for k, v in scores.items()}

        # Extract primary cause details
        primary = max(scores, key=scores.get)
        confidence = scores[primary]

        # Recommendations mapping
        recommendations = []
        explanation = ""

        if primary == 'database':
            explanation = f"High confidence ({int(confidence*100)}%) of database contention. Latency increases exponentially with connections, with high tail latency ratios indicating locks or unindexed queries."
            recommendations = [
                "Implement query caching for repeated reads.",
                "Verify database index mapping for frequently queried keys.",
                "Verify connection pool sizes in the application layer."
            ]
        elif primary == 'cpu':
            explanation = f"High confidence ({int(confidence*100)}%) of CPU saturation. Latency grows linearly with request counts, and throughput has flattened out indicating thread exhaustion."
            recommendations = [
                "Scale out instances horizontally behind a load balancer.",
                "Optimize processor intensive loops or async routines.",
                "Optimize JSON parsing or template compilation procedures."
            ]
        elif primary == 'memory':
            explanation = f"High confidence ({int(confidence*100)}%) of memory pressure. Volatility in latency ticks indicates garbage collection sweeps or memory leaks."
            recommendations = [
                "Profile node memory usage to isolate leaks.",
                "Increase heap allocation ceilings.",
                "Optimize object pooling allocations."
            ]
        elif primary == 'network':
            explanation = f"High confidence ({int(confidence*100)}%) of network limits or bandwidth bottlenecks."
            recommendations = [
                "Implement payload compression (gzip/brotli).",
                "Reduce payload object size representations.",
                "Optimize CDN parameters."
            ]
        elif primary == 'concurrency':
            explanation = f"High confidence ({int(confidence*100)}%) of socket concurrency limits. A sudden failure cliff was reached at a specific user threshold."
            recommendations = [
                "Increase file descriptor caps on the host machine.",
                "Increase server keep-alive and backlog connection values.",
                "Configure rate limit parameters."
            ]
        else:
            explanation = "Stable profile metrics. No anomalies or resource bottlenecks detected."
            recommendations = ["System is healthy. You can safely increase target load volumes."]

        return {
            "scores": scores,
            "primary_cause": primary,
            "confidence": confidence,
            "explanation": explanation,
            "recommendations": recommendations
        }

# Singleton instance
root_cause_scorer = RootCauseScorer()
