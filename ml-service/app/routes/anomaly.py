from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.anomaly_detector import anomaly_detector
from app.utils.influx_client import influx_query_client
import pandas as pd

router = APIRouter(prefix="/ml/anomaly", tags=["anomaly"])

class TrainRequest(BaseModel):
    test_run_id: str
    window_size: int = 15 # baseline window size in minutes

class DetectRequest(BaseModel):
    test_run_id: str
    tick_data: dict # Contain the latest tick parameters

@router.post("/train")
async def train_anomaly_models(request: TrainRequest):
    try:
        # 1. Query metrics baseline from InfluxDB
        df = influx_query_client.query_metrics_history(request.test_run_id, request.window_size)
        
        if df.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"No baseline metrics found in InfluxDB for test run: {request.test_run_id}"
            )
            
        # 2. Train models
        anomaly_detector.train(df, request.test_run_id)
        
        return {
            "message": "Anomaly models successfully trained.",
            "test_run_id": request.test_run_id,
            "datapoints_trained": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect")
async def detect_anomalies(request: DetectRequest):
    try:
        # Convert incoming single tick details into a DataFrame representation
        tick_df = pd.DataFrame([request.tick_data])
        
        # We need historical rolling standard deviation to match feature cols,
        # so query last 5 ticks from database and concat current tick.
        history = influx_query_client.query_metrics_history(request.test_run_id, 2)
        
        if not history.empty:
            tick_df = pd.concat([history.tail(4), tick_df], ignore_index=True)
            
        result = anomaly_detector.detect(tick_df, request.test_run_id)
        return result
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=400, 
            detail=f"Models not trained yet for test run. Train baseline first. Error: {str(fnf)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-batch")
async def detect_batch_anomalies(request: TrainRequest):
    import numpy as np
    try:
        df = influx_query_client.query_metrics_history(request.test_run_id, request.window_size)
        if df.empty:
            return {"anomalies": []}

        # Train models if not trained yet
        try:
            anomaly_detector.load(request.test_run_id)
        except FileNotFoundError:
            if len(df) >= 10:
                anomaly_detector.train(df, request.test_run_id)
            else:
                return {"anomalies": []}

        X = anomaly_detector._prepare_features(df)
        
        if_preds = anomaly_detector.if_model.predict(X)
        svm_preds = anomaly_detector.svm_model.predict(X)
        decision_scores = anomaly_detector.if_model.decision_function(X)

        anomalies = []
        for idx in range(len(df)):
            is_anom = (if_preds[idx] == -1) or (svm_preds[idx] == -1)
            if is_anom:
                prob = float(1.0 / (1.0 + np.exp(decision_scores[idx] * 10)))
                ts = df.iloc[idx]["timestamp"]
                ts_str = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
                
                anomalies.append({
                    "timestamp": ts_str,
                    "type": "Performance Anomaly",
                    "confidence": round(prob, 2),
                    "message": f"Outlier latency of {df.iloc[idx]['avg_latency']:.1f}ms detected under concurrency of {int(df.iloc[idx]['active_users'])} VUs."
                })
        
        return {"anomalies": anomalies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
