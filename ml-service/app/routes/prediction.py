from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.failure_predictor import failure_predictor

router = APIRouter(prefix="/ml/predict", tags=["prediction"])

class PredictRequest(BaseModel):
    test_run_id: str
    current_metrics: dict
    historical_runs_count: int = 0

@router.post("/failure")
async def predict_failure(request: PredictRequest):
    try:
        results = failure_predictor.predict(
            current_metrics=request.current_metrics,
            test_run_id=request.test_run_id,
            historical_runs_count=request.historical_runs_count
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
