# PR Description: Split Calculator Deep-Link Route Support

## Summary

This PR adds route-level support for shared Split Calculator links in the StellarSplit frontend. It introduces a dedicated `/calculator` page and a shared-state parser so exported calculator links can round-trip through the router and restore state when valid payloads are present.

## Related issue

- #493 Split Calculator Deep-Link Route Support

## Problem

- `frontend/src/components/SplitCalculator/SplitCalculator.tsx` currently exports share links under `/calculator?data=...`
- The React router did not mount a real `/calculator` route
- There was no hydration path for shared calculator state on page reload or incoming links

## What changed

### Added
- `frontend/src/pages/SplitCalculatorPage.tsx`
  - New routed calculator page
  - Reads `data` from URL search parameters
  - Decodes shared calculator payloads
  - Displays fallback messaging for invalid or malformed payloads
  - Passes hydrated state into `SplitCalculator`

- `frontend/src/utils/calculatorShare.ts`
  - Isolated shared-state encoding and decoding logic
  - Builds URL-safe share links
  - Handles invalid payloads gracefully

### Updated
- `frontend/src/main.tsx`
  - Added a real `/calculator` route for the routed calculator page

- `frontend/src/components/SplitCalculator/SplitCalculator.tsx`
  - Added support for `initialState`
  - Uses shared-state URL builder/decoder flow

## Validation

- Added tests in `frontend/src/utils/calculatorShare.spec.ts`
- Added tests in `frontend/src/pages/SplitCalculatorPage.spec.tsx`
- Verified:
  - valid share links hydrate calculator state
  - invalid payloads render fallback messaging
  - route hydration works after reload

## Acceptance criteria

- Shared calculator links resolve to a real `/calculator` route
- Valid `?data=...` payloads restore calculator state
- Invalid or malformed payloads fall back to default state with a warning

## Notes

This change makes calculator sharing more reliable and maintainable by isolating payload logic from UI and routing concerns.
