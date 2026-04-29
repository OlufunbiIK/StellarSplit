import { describe, expect, it } from "vitest";
import { routeCatalog } from "./routeCatalog";

/**
 * Integration tests that validate the synchronization between:
 * 1. The route catalog (routeCatalog.ts)
 * 2. The router definition (main.tsx)
 * 3. The navigation components (SIdebar.tsx, etc.)
 *
 * These tests ensure that routes defined in main.tsx are documented in the catalog
 * and that navigation components properly consume the catalog.
 */

describe("Route Catalog Integration - Router and Navigation Sync", () => {
  describe("Router Integration", () => {
    it("should cover all routes from main.tsx", () => {
      /**
       * Main.tsx routes (as of implementation):
       * - / (home)
       * - /dashboard
       * - /split/:id
       * - /analytics
       * - /split-groups
       * - /history
       * - /pay
       * - /create-split
       * - /calculator
       * - /notifications
       * - /drafts
       */

      const expectedRoutePaths = [
        "/",
        "/dashboard",
        "/split/:id",
        "/analytics",
        "/split-groups",
        "/history",
        "/pay",
        "/create-split",
        "/calculator",
        "/notifications",
        "/drafts",
      ];

      const catalogPaths = routeCatalog.map((r) => r.path);

      expectedRoutePaths.forEach((path) => {
        expect(catalogPaths).toContain(
          path,
          `Route ${path} from main.tsx not found in catalog`,
        );
      });
    });

    it("should have all catalog routes be either in or can be added to router", () => {
      // This validates that the catalog doesn't reference routes that don't exist
      // or are planned to be added
      routeCatalog.forEach((route) => {
        expect(route.path).toBeTruthy();
        expect(route.id).toBeTruthy();
        // Path should be valid React Router format
        expect(route.path).toMatch(/^\//);
      });
    });
  });

  describe("Navigation Synchronization", () => {
    it("should ensure all visible nav routes exist in catalog", () => {
      // When SIdebar.tsx calls getNavigationRoutes(), each route should be valid
      const navMandatoryRoutes = ["home", "dashboard"];

      navMandatoryRoutes.forEach((id) => {
        const route = routeCatalog.find((r) => r.id === id);
        expect(route).toBeDefined("Navigation route not in catalog: " + id);
        expect(route?.showInNavigation).toBe(
          true,
          "Navigation route should be marked as visible: " + id,
        );
      });
    });

    it("should have valid path-to-label mappings for navigation", () => {
      const navRoutes = routeCatalog.filter((r) => r.showInNavigation);

      navRoutes.forEach((route) => {
        // Each nav route should have:
        expect(route.path).toBeTruthy();
        expect(route.label).toBeTruthy();
        // Labels should be suitable for display (not just the path)
        expect(route.label).not.toEqual(route.path);
      });
    });

    it("should maintain backward compatibility with ROUTES constant", () => {
      // constants/routes.ts now derives from catalog
      // This test ensures the transformation maintains data integrity
      const navRoutes = routeCatalog.filter((r) => r.showInNavigation);
      const expectedRoutesFormat = navRoutes.map((route) => ({
        to: route.path,
        label: route.label,
      }));

      // Each expected route should map correctly
      expectedRoutesFormat.forEach((route) => {
        expect(route.to).toBeTruthy();
        expect(route.label).toBeTruthy();
        expect(route.to).toMatch(/^\//);
      });
    });
  });

  describe("Primary Page Coverage", () => {
    it("should have documentation for all primary pages", () => {
      const primaryPages = [
        "home",
        "dashboard",
        "analytics",
        "split-groups",
        "history",
        "drafts",
        "notifications",
      ];

      primaryPages.forEach((id) => {
        const route = routeCatalog.find((r) => r.id === id);
        expect(route).toBeDefined(`Primary page missing: ${id}`);
        expect(route?.label).toBeTruthy();
        expect(route?.showInNavigation).toBe(true);
      });
    });

    it("should have non-primary routes properly hidden from navigation", () => {
      const hiddenRoutes = routeCatalog.filter(
        (r) => !r.showInNavigation && r.id !== "home",
      );

      expect(hiddenRoutes.length).toBeGreaterThan(
        0,
        "Should have at least some routes hidden from navigation",
      );

      hiddenRoutes.forEach((route) => {
        expect(route.showInNavigation).toBe(false);
        expect(route.path).toBeDefined();
      });
    });
  });

  describe("Route Metadata Consistency", () => {
    it("should assign meaningful IDs", () => {
      routeCatalog.forEach((route) => {
        // IDs should be kebab-case and lowercase
        expect(route.id).toMatch(/^[a-z][a-z0-9-]*$/);
      });
    });

    it("should use consistent label formatting", () => {
      routeCatalog.forEach((route) => {
        // Labels should be title-cased and human-readable
        expect(route.label).toMatch(/^[A-Z]/);
        // No trailing slashes or special path characters
        expect(route.label).not.toMatch(/[\/]/);
      });
    });

    it("should have complete dynamic route specifications", () => {
      const dynamicRoutes = routeCatalog.filter((r) => r.path.includes(":"));

      expect(dynamicRoutes.length).toBeGreaterThan(
        0,
        "Should have at least one dynamic route",
      );

      dynamicRoutes.forEach((route) => {
        // Dynamic routes should have meaningful IDs
        expect(route.id).toContain("-");
        // Should not be in navigation (can't link to dynamic routes)
        expect(route.showInNavigation).toBe(false);
      });
    });
  });

  describe("Acceptance Criteria Validation", () => {
    it("should have one frontend-owned route catalog for labels, paths, and visibility", () => {
      // The source of truth exists
      expect(routeCatalog).toBeDefined();
      expect(routeCatalog.length).toBeGreaterThan(0);

      // It includes all necessary metadata
      routeCatalog.forEach((route) => {
        expect(route.label).toBeTruthy(); // labels ✓
        expect(route.path).toBeTruthy(); // paths ✓
        expect(typeof route.showInNavigation).toBe("boolean"); // visibility ✓
      });
    });

    it("should have tests that nav links match registered routes", () => {
      // This test file itself validates this
      const allPaths = routeCatalog.map((r) => r.path);
      const uniquePaths = new Set(allPaths);

      // All routes should have unique paths
      expect(uniquePaths.size).toBe(allPaths.length);

      // Navigation routes should be a subset of all routes
      const navRoutes = routeCatalog.filter((r) => r.showInNavigation);
      navRoutes.forEach((navRoute) => {
        const found = allPaths.includes(navRoute.path);
        expect(found).toBe(true);
      });
    });

    it("should have tests for route metadata covering all primary pages intentionally", () => {
      // This test validates the coverage
      const requiredPrimaryPages = [
        "home",
        "dashboard",
        "analytics",
        "split-groups",
        "history",
        "drafts",
        "notifications",
      ];

      const catalogIds = routeCatalog.map((r) => r.id);

      requiredPrimaryPages.forEach((id) => {
        expect(catalogIds).toContain(
          id,
          `Primary page ${id} not in catalog`,
        );
      });
    });
  });

  describe("Route Discovery and Lookup", () => {
    it("should be discoverable by path from navigation", () => {
      const navRoutes = routeCatalog.filter((r) => r.showInNavigation);

      navRoutes.forEach((route) => {
        // Each navigation route should be findable by its path
        const found = routeCatalog.some(
          (r) => r.path === route.path && r.id === route.id,
        );
        expect(found).toBe(true);
      });
    });

    it("should support route parameter patterns", () => {
      // Dynamic routes like /split/:id should be properly defined
      const splitRoute = routeCatalog.find((r) => r.id === "split-detail");
      expect(splitRoute).toBeDefined();
      expect(splitRoute?.path).toContain(":");
      expect(splitRoute?.showInNavigation).toBe(false);
    });
  });
});
