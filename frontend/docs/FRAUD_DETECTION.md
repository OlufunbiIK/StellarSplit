# Fraud Detection System Guide (Backend + ML)

## Overview

The fraud detection system is a **cross-service pipeline** involving:

- Backend API (request orchestration + storage)
- Fraud Detection Service (rules + orchestration layer)
- ML Microservice (model inference + scoring)
- Feedback loop (retraining system)

This document explains the **full lifecycle of fraud analysis**.

---

## 1. Fraud Detection Flow

### Step-by-step pipeline:

1. Backend receives transaction/event
2. Backend forwards payload to fraud-detection service
3. Fraud service calls ML microservice for scoring
4. ML service returns risk score + explanation
5. Backend evaluates thresholds
6. Alert is created if risk is high
7. Result is stored in database
8. User/admin feedback is collected later
9. Feedback is used for retraining

---

## 2. API Request Flow

### Backend Entry Point
