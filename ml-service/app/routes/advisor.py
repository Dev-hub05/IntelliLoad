from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.load_advisor import load_advisor

router = APIRouter(prefix="/ml/advisor", tags=["advisor"])

class RecommendRequest(BaseModel):
    current_metrics: dict
    failure_prediction: dict
    root_cause: dict

@router.post("/recommend")
async def recommend_load_tuning(request: RecommendRequest):
    try:
        results = load_advisor.recommend(
            current_metrics=request.current_metrics,
            failure_prediction=request.failure_prediction,
            root_cause=request.root_cause
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
