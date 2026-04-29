/**
 * Routes module - canonical source of truth for app navigation and routing.
 *
 * This module provides a centralized route catalog that powers both the router
 * and navigation surfaces (sidebar, navbar, etc.) to ensure they never drift.
 *
 * Key concepts:
 * - routeCatalog: Complete list of all routes with metadata
 * - getNavigationRoutes(): Primary routes shown in navigation
 * - Validation: Tests ensure consistency between router and nav
 *
 * Usage:
 * ```
 * import { getNavigationRoutes, getRouteById } from '@/routes';
 * ```
 */

export {
  routeCatalog,
  getNavigationRoutes,
  getRouteById,
  getRouteByPath,
  getAllRoutes,
  validateRouteCatalog,
  type RouteCatalogEntry,
} from "./routeCatalog";
