from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.root_cause_scorer import root_cause_scorer

router = APIRouter(prefix="/ml/root-cause", tags=["root-cause"])

class ScoreRequest(BaseModel):
    test_run_id: str
    metrics_history: list

@router.post("/score")
async def score_root_cause(request: ScoreRequest):
    try:
        results = root_cause_scorer.score(request.metrics_history)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
