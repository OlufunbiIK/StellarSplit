# AI Split Recommendation System

> **⚠️ Experimental Module - Not Currently Mounted in Production**

This module provides AI-powered suggestions for optimal split configurations.

## Status

- **Status**: 🧪 Experimental
- **Mounted**: No - This module is **not** included in the main FastAPI application (`app/main.py`)
- **API Availability**: Not exposed via the live API
- **Testing**: Available for local testing and development

## Features

- Analyze past splits
- Suggest participants
- Recommend amounts
- Predict payment likelihood
- Optimize for fairness

## ML Approach

- Collaborative filtering
- Time series analysis
- Classification for payment prediction

## Entry Points

- `collaborative.py` (collaborative filtering)
- `timeseries.py` (time series analysis)
- `classifier.py` (payment prediction)
- `api.py` (API for suggestions)
- `fairness.py` (fairness optimization)
- `test_recommendations.py` (tests)

## How to Test Locally

Since this module is not mounted in the main application, you can test it by:

1. **Import directly in Python**:

```python
from app.recommendations.collaborative import CollaborativeFilter
from app.recommendations.timeseries import SplitTimeSeries
from app.recommendations.classifier import PaymentClassifier
```

2. **Run the standalone API** (if you add a local test server):

```python
from fastapi import FastAPI
from app.recommendations.api import router

app = FastAPI()
app.include_router(router, prefix="/api/v1/recommendations")
```

## Integration Path

To integrate this module into the production API:

1. Add the router to `app/main.py`:

```python
from app.recommendations import recommendations

app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
```

2. Update the main README to reflect the new live endpoint
3. Add appropriate tests and validation
4. Update API documentation

## Future Work

- Performance optimization for large datasets
- Integration with real-time data streams
- Model retraining pipeline
- A/B testing framework for recommendation quality
