## Fraud Detection System Deployment

The fraud detection system consists of:

### Services:
- Backend API (Node/NestJS)
- Fraud Detection Service (internal module)
- ML Microservice (Python/FastAPI or similar)

---

### Dependency Flow:

Backend → Fraud Service → ML Service

---

### Critical Requirements:

- ML service must be deployed before enabling fraud scoring
- Timeout fallback must be enabled in backend
- Feature flags control:
  - enableFraudDetection
  - enableMLScoring

---

### Failure Handling:

If ML service is down:
- system falls back to rule engine
- alerts still generated in degraded mode