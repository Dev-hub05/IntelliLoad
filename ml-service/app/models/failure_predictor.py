import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
import os

class FailurePredictor:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.xgb_model = None
        self.feature_cols = ['avg_latency', 'p95_latency', 'throughput', 'error_rate', 'active_users']
        os.makedirs(model_dir, exist_ok=True)

    def predict(self, current_metrics: dict, test_run_id: str, historical_runs_count: int = 0) -> dict:
        """
        Execute Failure Prediction using 3-Phase progression:
        Phase A: Rule-Based (0-5 historical tests)
        Phase B: Anomaly Score Proxy (5-50 historical tests)
        Phase C: Supervised XGBoost (50+ historical tests)
        """
        # Extract features
        avg_latency = float(current_metrics.get('avg_latency', 0))
        p95_latency = float(current_metrics.get('p95_latency', 0))
        throughput = float(current_metrics.get('throughput', 0))
        error_rate = float(current_metrics.get('error_rate', 0))
        active_users = float(current_metrics.get('active_users', 0))

        # Default outputs
        probability = 0.0
        risk_level = "LOW"
        model_phase = "Phase A: Heuristic Rules"
        factors = []

        # --- Phase C: Supervised XGBoost ---
        xgb_path = os.path.join(self.model_dir, "xgboost_failure_model.json")
        if historical_runs_count >= 50 and os.path.exists(xgb_path):
            try:
                if not self.xgb_model:
                    self.xgb_model = xgb.Booster()
                    self.xgb_model.load_model(xgb_path)
                
                # Format features into DMatrix
                feat_dict = {
                    'avg_latency': [avg_latency],
                    'p95_latency': [p95_latency],
                    'throughput': [throughput],
                    'error_rate': [error_rate],
                    'active_users': [active_users]
                }
                X = pd.DataFrame(feat_dict)[self.feature_cols]
                dmat = xgb.DMatrix(X)
                
                probability = float(self.xgb_model.predict(dmat)[0])
                model_phase = "Phase C: Supervised XGBoost"
                
                # Simple feature attribution estimation
                importance = self.xgb_model.get_score(importance_type='gain')
                total_imp = sum(importance.values()) if importance else 1
                for feat, score in importance.items():
                    factors.append({"feature": feat, "importance": round(score / total_imp, 3)})
            except Exception as e:
                print(f"XGBoost prediction failed, falling back to heuristics: {str(e)}")

        # --- Phase B: Anomaly Score Proxy ---
        if model_phase == "Phase A: Heuristic Rules" and historical_runs_count >= 5:
            # Query the anomaly model to yield failure risk probability
            try:
                if_path = os.path.join(self.model_dir, f"if_{test_run_id}.pkl")
                if os.path.exists(if_path):
                    if_model = joblib.load(if_path)
                    X_val = np.array([[avg_latency, p95_latency, throughput, error_rate, active_users, 0]]) # 0 volatility
                    if_score = float(if_model.decision_function(X_val)[0])
                    probability = float(1.0 / (1.0 + np.exp(if_score * 8)))
                    model_phase = "Phase B: Anomaly Proxy"
                    factors = [{"feature": "latency_anomaly_score", "importance": 0.8}]
            except Exception as e:
                print(f"Anomaly proxy prediction failed: {str(e)}")

        # --- Phase A: Heuristic Rules (Fallback) ---
        if model_phase == "Phase A: Heuristic Rules":
            # Heuristics based on latency spikes and error threshold cliffs
            latency_factor = min(1.0, p95_latency / 5000.0) * 0.4 # max 40% importance
            error_factor = min(1.0, error_rate / 25.0) * 0.4     # max 40% importance
            users_factor = min(1.0, active_users / 500.0) * 0.2  # max 20% importance
            
            probability = latency_factor + error_factor + users_factor
            
            factors = [
                {"feature": "p95_latency", "importance": round(latency_factor / max(0.01, probability), 3)},
                {"feature": "error_rate", "importance": round(error_factor / max(0.01, probability), 3)},
                {"feature": "active_users", "importance": round(users_factor / max(0.01, probability), 3)}
            ]

        # Calculate risk labels
        probability = round(probability, 3)
        if probability >= 0.8:
            risk_level = "CRITICAL"
        elif probability >= 0.5:
            risk_level = "HIGH"
        elif probability >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "failure_probability": probability,
            "risk_level": risk_level,
            "model_phase": model_phase,
            "contributing_factors": sorted(factors, key=lambda x: x['importance'], reverse=True)
        }

    def train_xgboost(self, training_data: pd.DataFrame):
        """
        Train the Phase C supervised XGBoost model when sufficient runs are completed
        """
        if len(training_data) < 100:
            raise ValueError("Supervised XGBoost training requires at least 100 metric data instances.")

        X = training_data[self.feature_cols]
        y = training_data['is_failure'] # 1 if failure events occurred, 0 otherwise

        dtrain = xgb.DMatrix(X, label=y)
        params = {
            'max_depth': 4,
            'eta': 0.1,
            'objective': 'binary:logistic',
            'eval_metric': 'logloss'
        }
        
        self.xgb_model = xgb.train(params, dtrain, num_boost_round=50)
        xgb_path = os.path.join(self.model_dir, "xgboost_failure_model.json")
        self.xgb_model.save_model(xgb_path)
        print("Supervised failure prediction model updated successfully.")

# Singleton instance
failure_predictor = FailurePredictor()
