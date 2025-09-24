<template>
  <div class="min-h-screen bg-gray-50 p-8 md:py-8 py-30 md:w-[78vw] w-[100vw]">
    <h1 class="text-3xl font-bold mb-6">🛒 My Cart</h1>

    <!-- Empty Cart -->
    <div v-if="!cartStore.cart.length" class="text-gray-600">
      Your cart is empty.
    </div>

    <!-- Cart Items -->
    <div v-else class="space-y-4">
      <div
        v-for="course in cartStore.cart"
        :key="course.id"
        class="flex items-center justify-between bg-white p-4 rounded-lg shadow"
      >
        <div>
          <h2 class="font-semibold">{{ course.title }}</h2>
          <p class="text-gray-600">By {{ course.professor }}</p>
          <span class="font-bold text-blue-600">${{ course.price }}</span>
        </div>

        <div class="md:flex md:flex-row gap-3 flex flex-col">
          <!-- Remove Button -->
          <button
            @click="cartStore.removeFromCart(course.id)"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Remove
          </button>

          <!-- Checkout Button -->
          <button
            @click="checkout(course)"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Checkout
          </button>
        </div>
      </div>

      <!-- Total Section -->
      <div class="mt-6 bg-white p-4 rounded-lg shadow text-right">
        <p class="text-xl font-semibold">Total: ${{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
definePageMeta({
  requiresAuth: true,
});

import { useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { computed } from "vue";
import { useCartStore } from "@/stores/cart";
import { usePaymentStore } from "@/stores/payments";
import type { Course } from "@/types/Course";

const auth = useAuthStore();
const router = useRouter();
const cartStore = useCartStore();
const paymentStore = usePaymentStore();

const total = computed(() =>
  cartStore.cart.reduce((sum, c: Course) => sum + c.price, 0)
);

const checkout = (course: Course) => {
  if (!auth.isAuthenticated) {
    // if user not logged in → send them to login page
    router.push("/login?redirect=/payments/" + course.id);
    return;
  }
  // Start payment process
  paymentStore.startPayment(course);

  // Navigate to payment page
  router.push("/payments/" + course.id);
};
import { onMounted } from "vue";

onMounted(() => {
  cartStore.loadCart();
});
</script>
