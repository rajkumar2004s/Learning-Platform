// stores/wishlist.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { Course } from "@/types/Course";

export const useWishlistStore = defineStore("wishlist", () => {
  const wishlist = ref<Course[]>([]);

  // ✅ Safe load (client only)
  const loadWishlist = () => {
    if (process.client) {
      try {
        const saved = localStorage.getItem("wishlist");
        wishlist.value = saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to load wishlist:", e);
        wishlist.value = [];
      }
    }
  };

  // ✅ Auto-persist (client only)
  if (process.client) {
    watch(
      wishlist,
      (val) => {
        localStorage.setItem("wishlist", JSON.stringify(val));
      },
      { deep: true }
    );
  }

  const addToWishlist = (course: Course) => {
    if (!isInWishlist(course.id)) {
      wishlist.value.push(course);
    }
  };

  const removeFromWishlist = (courseId: string) => {
    wishlist.value = wishlist.value.filter((c) => c.id !== courseId);
  };

  const toggleWishlist = (course: Course) => {
    if (isInWishlist(course.id)) {
      removeFromWishlist(course.id);
    } else {
      addToWishlist(course);
    }
  };

  const isInWishlist = (courseId: string) =>
    wishlist.value.some((c) => c.id === courseId);

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    loadWishlist, // ✅ expose loadWishlist
  };
});
