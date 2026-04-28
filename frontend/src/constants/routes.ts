/**
 * Navigation routes exported for backward compatibility.
 * This now consumes the canonical route catalog.
 * 
 * IMPORTANT: Do not maintain separate route definitions here.
 * Always update the catalog in src/routes/routeCatalog.ts instead.
 */

import { getNavigationRoutes } from "../routes/routeCatalog";

/**
 * @deprecated Use getNavigationRoutes() from routeCatalog instead.
 * This export is maintained for backward compatibility.
 */
export const ROUTES = getNavigationRoutes().map((route) => ({
  to: route.path,
  label: route.label,
}));
