import { useAuthStore } from "../app/stores/auth";
import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import type { RouteLocationNormalized } from "vue-router";

export default defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalized) => {
    if (typeof window === "undefined") return;

    const auth = useAuthStore();
    await auth.initAuth();

    const requiresAuth = !!to.meta?.requiresAuth;
    const requiresAdmin = !!to.meta?.requiresAdmin;

    if (requiresAuth && !auth.isAuthenticated) {
      if (to.path !== "/login") {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
      }
      return navigateTo("/login");
    }

    if (requiresAdmin) {
      if (!auth.isAuthenticated) {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
      }
      if (!auth.isAdmin) {
        return navigateTo("/unauthorized");
      }
    }
  }
);
