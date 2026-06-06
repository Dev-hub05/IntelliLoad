import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="IntelliLoad ML Service",
    description="AI Engine for anomaly detection, failure prediction, root cause scoring, and load advising.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ml/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "anomaly_detector": False,
            "failure_predictor": False,
            "root_cause_scorer": True,  # Heuristic scoring initialized
            "load_advisor": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
