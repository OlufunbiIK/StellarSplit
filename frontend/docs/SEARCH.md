# Search System Behavior Guide

## Overview

The search system supports multiple ranking and retrieval strategies depending on database capabilities and query type. It is designed to gracefully degrade when advanced features are unavailable.

---

## 1. Feature Detection Model

At runtime, the search service detects available database capabilities:

### Supported features:
- Full Text Search (FTS)
- Trigram similarity (pg_trgm)
- Basic ILIKE fallback

### Detection order:
1. Check if FTS indexes exist
2. Check if trigram extension is enabled
3. Fall back to basic LIKE queries

---

## 2. Query Execution Strategy

Search execution follows a layered approach:

### Layer 1 — Full Text Search (Primary)
Used when FTS is available.

- Uses `to_tsvector`
- Ranked using `ts_rank`
- Best performance + semantic matching

---

### Layer 2 — Trigram Similarity (Secondary)
Used when FTS is unavailable or insufficient.

- Uses `similarity(column, query)`
- Requires `pg_trgm`
- Handles typos and fuzzy matching

---

### Layer 3 — Fallback LIKE Search (Last Resort)

Used when no advanced DB features are available.

- Uses `ILIKE '%query%'`
- No ranking intelligence
- Lowest performance and relevance

---

## 3. Ranking Model

When multiple strategies are active, results are merged and ranked using:

Priority order:
1. FTS rank score (highest weight)
2. Trigram similarity score
3. Relevance boost (exact match in title/name)
4. Recency boost (if timestamp exists)

Final score is normalized before sorting.

---

## 4. Pagination Model (Cursor-Based)

Search uses cursor pagination, not offset pagination.

### Request parameters:
- `limit` → number of results per page
- `cursor` → last seen result identifier

### How cursor works:
- Cursor stores `(score, id)` pair
- Next query uses:
  - `WHERE (score, id) < cursor`
  - ordered by `(score DESC, id DESC)`

### Benefits:
- Stable pagination under inserts
- No duplicates across pages
- Better performance than OFFSET

---

## 5. Fallback Behavior Summary

| Capability Missing | System Behavior |
|--------------------|-----------------|
| FTS disabled       | Switch to trigram |
| Trigram disabled   | Switch to LIKE |
| No indexes         | Full table scan (last resort) |

---

## 6. Query Degradation Rules

When performance constraints exist:

- Reduce ranking complexity
- Skip trigram scoring
- Limit result set early
- Prefer indexed columns only

---

## 7. DTO Contract Alignment

Search DTO supports:

- `query: string`
- `limit?: number`
- `cursor?: string`
- `filters?: object`

Validation ensures:
- limit max cap enforced
- cursor format validated
- empty query rejected

---

## 8. Validation Source of Truth

This document aligns with:

- `backend/src/search/search.service.ts`
- Search DTO definitions
- Database index configuration

---

## 9. Notes for Frontend Consumers

- Always treat results as **ranked, not ordered by insertion**
- Do not assume stable ordering without cursor usage
- Cursor must be treated as opaque string