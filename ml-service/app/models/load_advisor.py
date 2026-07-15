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
        active_users = float(current_metrics.get("active_users", 10))

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

        # Calculate suggested connections dynamically based on recommendation
        suggested_connections = active_users
        if recommendation == "SCALE_UP":
            if active_users < 20:
                suggested_connections = 40
            elif active_users < 50:
                suggested_connections = 80
            elif active_users < 100:
                suggested_connections = 150
            elif active_users < 200:
                suggested_connections = 260
            else:
                suggested_connections = min(500, int(active_users * 1.5))
        elif recommendation == "SCALE_DOWN":
            suggested_connections = max(10, int(active_users * 0.7))

        return {
            "recommendation": recommendation,
            "message": message,
            "actions": actions,
            "suggested_connections": int(suggested_connections),
            "input_risk_level": risk,
            "input_primary_bottleneck": primary_cause
        }

# Singleton instance
load_advisor = LoadAdvisor()
