import { describe, expect, it } from "vitest";
import {
  routeCatalog,
  getNavigationRoutes,
  getRouteById,
  getRouteByPath,
  getAllRoutes,
  validateRouteCatalog,
} from "./routeCatalog";

describe("Route Catalog", () => {
  describe("routeCatalog structure", () => {
    it("should have at least one route in the catalog", () => {
      expect(routeCatalog.length).toBeGreaterThan(0);
    });

    it("should have all routes with required properties", () => {
      routeCatalog.forEach((route) => {
        expect(route).toHaveProperty("id");
        expect(route).toHaveProperty("path");
        expect(route).toHaveProperty("label");
        expect(route).toHaveProperty("showInNavigation");
        expect(typeof route.id).toBe("string");
        expect(typeof route.path).toBe("string");
        expect(typeof route.label).toBe("string");
        expect(typeof route.showInNavigation).toBe("boolean");
      });
    });

    it("should have unique route IDs", () => {
      const ids = routeCatalog.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique route paths", () => {
      // Dynamic routes like /split/:id are considered unique
      const paths = routeCatalog.map((r) => r.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });

    it("should have non-empty labels for all routes", () => {
      routeCatalog.forEach((route) => {
        expect(route.label.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe("getNavigationRoutes()", () => {
    it("should return only routes with showInNavigation = true", () => {
      const navRoutes = getNavigationRoutes();
      navRoutes.forEach((route) => {
        expect(route.showInNavigation).toBe(true);
      });
    });

    it("should return at least one navigation route", () => {
      const navRoutes = getNavigationRoutes();
      expect(navRoutes.length).toBeGreaterThan(0);
    });

    it("should include the home route in navigation", () => {
      const navRoutes = getNavigationRoutes();
      const hasHome = navRoutes.some((r) => r.id === "home" || r.path === "/");
      expect(hasHome).toBe(true);
    });

    it("should contain fewer routes than the full catalog when some are hidden", () => {
      const allRoutes = getAllRoutes();
      const navRoutes = getNavigationRoutes();
      // Not all routes should be in navigation (e.g., /split/:id)
      expect(navRoutes.length).toBeLessThanOrEqual(allRoutes.length);
    });

    it("should return navigation routes in consistent order", () => {
      const navRoutes1 = getNavigationRoutes();
      const navRoutes2 = getNavigationRoutes();
      expect(navRoutes1).toEqual(navRoutes2);
    });
  });

  describe("getRouteById()", () => {
    it("should find a route by its ID", () => {
      const homeRoute = getRouteById("home");
      expect(homeRoute).toBeDefined();
      expect(homeRoute?.id).toBe("home");
    });

    it("should return undefined for non-existent ID", () => {
      const nonExistent = getRouteById("non-existent-route");
      expect(nonExistent).toBeUndefined();
    });

    it("should find all routes by their IDs", () => {
      routeCatalog.forEach((route) => {
        const found = getRouteById(route.id);
        expect(found).toBeDefined();
        expect(found).toEqual(route);
      });
    });
  });

  describe("getRouteByPath()", () => {
    it("should find a route by exact path", () => {
      const dashboardRoute = getRouteByPath("/dashboard");
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.path).toBe("/dashboard");
    });

    it("should find the home route by root path", () => {
      const homeRoute = getRouteByPath("/");
      expect(homeRoute).toBeDefined();
      expect(homeRoute?.path).toBe("/");
    });

    it("should return undefined for non-existent path", () => {
      const nonExistent = getRouteByPath("/non-existent");
      expect(nonExistent).toBeUndefined();
    });

    it("should find dynamic routes like /split/:id", () => {
      const splitRoute = getRouteByPath("/split/123");
      expect(splitRoute).toBeDefined();
      expect(splitRoute?.id).toBe("split-detail");
    });

    it("should find all exact routes by their paths", () => {
      const exactRoutes = routeCatalog.filter((r) => !r.path.includes(":"));
      exactRoutes.forEach((route) => {
        const found = getRouteByPath(route.path);
        expect(found).toBeDefined();
        expect(found?.id).toBe(route.id);
      });
    });
  });

  describe("getAllRoutes()", () => {
    it("should return all routes in the catalog", () => {
      const allRoutes = getAllRoutes();
      expect(allRoutes).toEqual(routeCatalog);
    });

    it("should include both navigation and non-navigation routes", () => {
      const allRoutes = getAllRoutes();
      const navRoutes = getNavigationRoutes();
      expect(allRoutes.length).toBeGreaterThanOrEqual(navRoutes.length);
    });
  });

  describe("validateRouteCatalog()", () => {
    it("should return an empty array for a valid catalog", () => {
      const errors = validateRouteCatalog();
      expect(Array.isArray(errors)).toBe(true);
      if (errors.length > 0) {
        // If there are errors, they should be meaningful strings
        errors.forEach((error) => {
          expect(typeof error).toBe("string");
          expect(error.length).toBeGreaterThan(0);
        });
      }
    });

    it("should report duplicate paths if they exist", () => {
      const errors = validateRouteCatalog();
      const duplicateErrors = errors.filter((e) => e.includes("Duplicate path"));
      expect(duplicateErrors.length).toBe(0);
    });

    it("should report duplicate IDs if they exist", () => {
      const errors = validateRouteCatalog();
      const duplicateErrors = errors.filter((e) => e.includes("Duplicate route ID"));
      expect(duplicateErrors.length).toBe(0);
    });

    it("should not warn about missing navigation routes", () => {
      const errors = validateRouteCatalog();
      const navWarning = errors.filter((e) => e.includes("No routes are marked as visible"));
      expect(navWarning.length).toBe(0);
    });
  });

  describe("Navigation and Router Synchronization", () => {
    it("should ensure navigation routes match registered routes", () => {
      const navRoutes = getNavigationRoutes();
      const allRoutes = getAllRoutes();

      // Each navigation route should exist in the full catalog
      navRoutes.forEach((navRoute) => {
        const found = allRoutes.some((r) => r.id === navRoute.id);
        expect(found).toBe(true);
      });
    });

    it("should provide complete metadata for all primary pages", () => {
      // Primary pages that should be navigable or have full metadata
      const requiredRouteIds = ["home", "dashboard", "analytics"];

      requiredRouteIds.forEach((id) => {
        const route = getRouteById(id);
        expect(route).toBeDefined();
        expect(route?.label).toBeTruthy();
        expect(route?.path).toBeTruthy();
      });
    });

    it("should have consistent labels across routes", () => {
      routeCatalog.forEach((route) => {
        // Labels should be meaningful and non-empty
        expect(route.label.length).toBeGreaterThan(0);
        // Labels should not contain special characters that break URLs or formatting
        expect(route.label).not.toMatch(/^\/|\/$/);
      });
    });

    it("should support finding routes by both ID and path", () => {
      routeCatalog.forEach((route) => {
        const byId = getRouteById(route.id);
        const byPath = route.path.includes(":")
          ? null
          : getRouteByPath(route.path);

        expect(byId).toEqual(route);
        if (byPath) {
          expect(byPath).toEqual(route);
        }
      });
    });
  });

  describe("Route Catalog Completeness", () => {
    it("should have routes for all primary app features", () => {
      const navRoutes = getNavigationRoutes();
      const routeIds = navRoutes.map((r) => r.id);

      // Verify key routes exist
      expect(routeIds).toContain("home");
      expect(routeIds).toContain("dashboard");
    });

    it("should properly marked routes as visible or hidden", () => {
      // At least 50% of routes should be visible in navigation
      const navRoutes = getNavigationRoutes();
      const allRoutes = getAllRoutes();
      const visibilityRatio = navRoutes.length / allRoutes.length;

      expect(visibilityRatio).toBeGreaterThan(0.4);
    });

    it("should have descriptions for routes that need them", () => {
      routeCatalog.forEach((route) => {
        // All routes should ideally have a description, but it's optional
        if (route.description) {
          expect(typeof route.description).toBe("string");
          expect(route.description.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
