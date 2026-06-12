class LoadAdvisor:
    def recommend(self, current_metrics: dict, failure_prediction: dict, root_cause: dict) -> dict:
        """
        Calculates suggestions based on current failure risk and bottleneck signals.
        """
        prob = failure_prediction.get("failure_probability", 0.0)
        risk = failure_prediction.get("risk_level", "LOW")
        primary_cause = root_cause.get("primary_cause", "none")
        
        avg_latency = float(current_metrics.get("avg_latency", 0))
        error_rate = float(current_metrics.get("error_rate", 0))

        recommendation = "HOLD"
        message = "Metrics are stable. Hold traffic levels constant to evaluate baseline stability."
        actions = []

        if risk == "CRITICAL" or prob >= 0.8:
            recommendation = "SCALE_DOWN"
            message = "Critical failure threat. Scale down load immediately to restore API health."
            if primary_cause == 'database':
                actions.append("Decrease load to release database thread contention locks.")
            elif primary_cause == 'concurrency':
                actions.append("Decrease load below the socket connection failure threshold.")
            else:
                actions.append("Decrease active user count by 50% to prevent server crash.")

        elif risk == "HIGH" or prob >= 0.5:
            recommendation = "SCALE_DOWN"
            message = "High probability of failure. Reduce active users count to stabilize response times."
            actions.append("Reduce connections by 20% and verify if response times recover.")
            
        elif error_rate < 1.0 and avg_latency < 500 and prob < 0.25:
            recommendation = "SCALE_UP"
            message = "System is running healthy with low latency. Scale up connections to identify capacity limit."
            actions.append("Increase active user count by +25% or 20 VUs.")
        
        elif prob < 0.4:
            recommendation = "HOLD"
            message = "Holding traffic constant. Minor latency volatility observed."
            actions.append("Monitor latency values for the next 15 seconds.")

        return {
            "recommendation": recommendation,
            "message": message,
            "actions": actions,
            "input_risk_level": risk,
            "input_primary_bottleneck": primary_cause
        }

# Singleton instance
load_advisor = LoadAdvisor()
