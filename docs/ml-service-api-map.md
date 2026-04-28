# ML Service API Map

This document provides a comprehensive map of the ML Service API surface, distinguishing between live mounted endpoints and experimental modules.

## Live API Endpoints

The following endpoints are mounted in `ml-service/app/main.py` and available in production:

### Health Check Router
**Prefix**: None  
**Tag**: Health  
**Source**: `app/api/health.py`

| Method | Endpoint | Description | Response Model |
|--------|----------|-------------|----------------|
| GET | `/health` | Service health check | `HealthResponse` |
| GET | `/ready` | Kubernetes readiness check | JSON |

### Analysis Router
**Prefix**: `/api/v1`  
**Tag**: Analysis  
**Source**: `app/api/analyze.py`

| Method | Endpoint | Description | Request Model | Response Model |
|--------|----------|-------------|---------------|----------------|
| POST | `/api/v1/analyze/split` | Analyze split for fraud risk | `SplitData` + optional `UserHistory` | `AnalysisResponse` |
| POST | `/api/v1/analyze/payment` | Analyze payment for fraud risk | `PaymentData` + optional `SplitContext` | `AnalysisResponse` |
| POST | `/api/v1/analyze/batch` | Batch analyze multiple entities | `BatchAnalysisRequest` | `BatchAnalysisResponse` |

### Models Router
**Prefix**: `/api/v1`  
**Tag**: Models  
**Source**: `app/api/models.py`

| Method | Endpoint | Description | Request Model | Response Model |
|--------|----------|-------------|---------------|----------------|
| GET | `/api/v1/models/versions` | Get available model versions | None | `ModelVersionsResponse` |
| POST | `/api/v1/models/retrain` | Trigger model retraining | `RetrainRequest` | `RetrainResponse` |
| GET | `/api/v1/models/training/{job_id}` | Get training job status | None | `TrainingStatusResponse` |
| POST | `/api/v1/models/load/{version}` | Load specific model version | None | JSON |

### Feedback Router
**Prefix**: `/api/v1`  
**Tag**: Feedback  
**Source**: `app/api/feedback.py`

| Method | Endpoint | Description | Request Model | Response Model |
|--------|----------|-------------|---------------|----------------|
| POST | `/api/v1/feedback` | Submit fraud alert feedback | `FeedbackRequest` | `FeedbackResponse` |
| GET | `/api/v1/feedback/stats` | Get feedback statistics | None | `FeedbackStats` |
| GET | `/api/v1/feedback/recent` | Get recent feedback entries | Query param: `limit` | JSON |

### Metrics Endpoint
**Prefix**: None  
**Tag**: None (internal)  
**Source**: `app/main.py`

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/metrics` | Prometheus metrics | Prometheus format |

## Experimental Modules

The following modules exist but are **not mounted** in the production API:

### Recommendations Module
**Status**: 🧪 Experimental  
**Location**: `app/recommendations/`  
**Router**: `app/recommendations/api.py` (not mounted)  
**Documentation**: `app/recommendations/README.md`

#### Available Capabilities (Not Exposed via API)

| Component | Description | File |
|-----------|-------------|------|
| Collaborative Filtering | Suggest participants based on user similarity | `collaborative.py` |
| Time Series Analysis | Predict next split timing | `timeseries.py` |
| Payment Classifier | Predict payment likelihood | `classifier.py` |
| Fairness Optimization | Optimize split fairness | `fairness.py` |

#### Potential Endpoint (If Mounted)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/recommendations/recommend` | Generate split recommendations |

> **Note**: To test the recommendations module, import directly or create a local test server. See `app/recommendations/README.md` for details.

## Router Registration

### Current Registration (app/main.py)

```python
# Live routers
app.include_router(health.router, tags=["Health"])
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(models.router, prefix="/api/v1", tags=["Models"])
app.include_router(feedback.router, prefix="/api/v1", tags=["Feedback"])

# Metrics endpoint (inline)
@app.get("/metrics")
async def metrics():
    ...
```

### Experimental Router (Not Registered)

```python
# Not currently included in main.py
# from app.recommendations.api import router
# app.include_router(router, prefix="/api/v1/recommendations", tags=["Recommendations"])
```

## API Summary

### Total Live Endpoints: 11
- Health: 2 endpoints
- Analysis: 3 endpoints
- Models: 4 endpoints
- Feedback: 3 endpoints
- Metrics: 1 endpoint

### Experimental Capabilities: 4
- Collaborative filtering
- Time series prediction
- Payment classification
- Fairness optimization

## Integration Notes

### For Backend Integration
The NestJS backend should call the live endpoints at:
- `http://ml-service:8000/health` - Health checks
- `http://ml-service:8000/api/v1/analyze/*` - Fraud detection
- `http://ml-service:8000/api/v1/models/*` - Model management
- `http://ml-service:8000/api/v1/feedback/*` - Feedback submission
- `http://ml-service:8000/metrics` - Monitoring

### For Experimental Features
To integrate the recommendations module:
1. Mount the router in `app/main.py`
2. Add authentication/authorization if needed
3. Update this API map
4. Update main README.md
5. Add integration tests

## Validation

This API map was validated against:
- `ml-service/app/main.py` - Router registration
- `ml-service/app/api/health.py` - Health endpoints
- `ml-service/app/api/analyze.py` - Analysis endpoints
- `ml-service/app/api/models.py` - Model management endpoints
- `ml-service/app/api/feedback.py` - Feedback endpoints
- `ml-service/app/recommendations/api.py` - Experimental recommendations
- `ml-service/app/recommendations/README.md` - Experimental module documentation

**Last Updated**: 2026-04-28  
**Service Version**: 1.0.0
