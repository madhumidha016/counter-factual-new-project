from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.database.db import get_session, get_cnn_prediction
from backend.ml.similarity.retriever import get_retriever

router = APIRouter(prefix="/api", tags=["Similar Cases"])

@router.get("/similar-cases")
async def get_similar_cases(
    session_id: str = Query(...),
    stage_filter: Optional[str] = Query("all"),
    diagnosis_filter: Optional[str] = Query("all"),
    min_similarity: Optional[float] = Query(0.0)
):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    cnn_pred = get_cnn_prediction(session_id)
    if not cnn_pred:
        raise HTTPException(status_code=400, detail="Please run CNN Detection before retrieving similar cases.")
        
    embedding = cnn_pred.get("embedding")
    retriever = get_retriever()
    
    cases = retriever.retrieve_similar_cases(
        query_embedding=embedding,
        top_k=8, # Allow up to 8 when filtered
        stage_filter=stage_filter,
        diagnosis_filter=diagnosis_filter,
        min_similarity=min_similarity or 0.0
    )
    
    return {
        "session_id": session_id,
        "total_retrieved": len(cases),
        "filters_applied": {
            "stage": stage_filter,
            "diagnosis": diagnosis_filter,
            "min_similarity": min_similarity
        },
        "cases": cases
    }

