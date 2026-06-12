import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
import joblib
import os

class AnomalyDetector:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.if_model = None
        self.svm_model = None
        self.feature_cols = [
            'avg_latency', 'p95_latency', 'throughput', 
            'error_rate', 'active_users', 'latency_volatility'
        ]
        os.makedirs(model_dir, exist_ok=True)

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract numeric input features and calculate rolling indicators like volatility.
        """
        features = df.copy()
        
        # Latency Volatility: rolling standard deviation of average latency (window size: 5 ticks)
        features['latency_volatility'] = features['avg_latency'].rolling(window=5, min_periods=1).std().fillna(0)
        
        # Return only target feature columns
        return features[self.feature_cols]

    def train(self, history_df: pd.DataFrame, test_run_id: str):
        """
        Fit Isolation Forest and One-Class SVM models based on baseline history.
        """
        if len(history_df) < 10:
            raise ValueError("Insufficient baseline metrics points to fit models (requires at least 10 ticks).")

        X = self._prepare_features(history_df)
        
        # 1. Fit Isolation Forest
        self.if_model = IsolationForest(contamination=0.05, random_state=42)
        self.if_model.fit(X)
        
        # 2. Fit One-Class SVM
        self.svm_model = OneClassSVM(nu=0.05, kernel='rbf', gamma='scale')
        self.svm_model.fit(X)
        
        # Save models to disk
        self.save(test_run_id)
        print(f"Model training successfully completed for test run: {test_run_id}")

    def detect(self, current_tick_df: pd.DataFrame, test_run_id: str) -> dict:
        """
        Perform ensemble anomaly check. Flags if either Isolation Forest or One-Class SVM signals outlier.
        """
        # Load models if not loaded
        if not self.if_model or not self.svm_model:
            self.load(test_run_id)

        X = self._prepare_features(current_tick_df).tail(1)
        
        if X.empty:
            return {"is_anomaly": False, "score": 0.0, "method": "none"}
            
        # sklearn predict outputs: -1 for anomaly, 1 for normal
        if_pred = self.if_model.predict(X)[0]
        svm_pred = self.svm_model.predict(X)[0]
        
        # Decision scores (lower score = more anomalous)
        if_score = float(self.if_model.decision_function(X)[0])
        
        # Anomaly flagged if either model detects outlier (ensemble)
        is_anomaly = (if_pred == -1) or (svm_pred == -1)
        
        # Normalize score into a confidence probability (0.0 to 1.0)
        # decision_function yields values centered near 0. Threshold is roughly <= 0 for outlier.
        anomaly_probability = 1.0 / (1.0 + np.exp(if_score * 10)) # Sigmoid mapping

        return {
            "is_anomaly": bool(is_anomaly),
            "score": round(anomaly_probability, 3),
            "isolation_forest_anomaly": bool(if_pred == -1),
            "one_class_svm_anomaly": bool(svm_pred == -1)
        }

    def save(self, test_run_id: str):
        joblib.dump(self.if_model, os.path.join(self.model_dir, f"if_{test_run_id}.pkl"))
        joblib.dump(self.svm_model, os.path.join(self.model_dir, f"svm_{test_run_id}.pkl"))

    def load(self, test_run_id: str):
        if_path = os.path.join(self.model_dir, f"if_{test_run_id}.pkl")
        svm_path = os.path.join(self.model_dir, f"svm_{test_run_id}.pkl")
        
        if not os.path.exists(if_path) or not os.path.exists(svm_path):
            raise FileNotFoundError(f"Trained models not found for test run ID: {test_run_id}")
            
        self.if_model = joblib.load(if_path)
        self.svm_model = joblib.load(svm_path)

# Singleton instance for inference
anomaly_detector = AnomalyDetector()
