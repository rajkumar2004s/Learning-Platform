<template>
  <div
    class="min-h-screen flex items-center justify-center p-6 w-[100vw] md:w-[82vw] bg-gray-50"
  >
    <div
      class="bg-white shadow-2xl rounded-3xl p-12 w-full max-w-5xl animate_animated animate_fadeInUp"
    >
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
        ></div>
      </div>

      <div v-else-if="course" class="space-y-8">
        <div class="flex flex-col md:flex md:flex-row items-center gap-8 mb-10">
          <img
            :src="course.imgUrl"
            :alt="course.title"
            class="md:w-48 md:h-32 object-cover rounded-xl shadow"
          />
          <div class="flex-1 w-full">
            <h2 class="text-3xl font-bold">{{ course.title }}</h2>
            <p class="text-gray-600 text-lg">By {{ course.professor }}</p>
            <p class="mt-3 text-2xl font-semibold text-blue-600">
              ${{ course.price }}
            </p>
          </div>

          <div class="md:w-40 w-full">
            <label class="block text-gray-700 font-medium mb-2 text-sm">
              Payment Methods
            </label>
            <div class="text-sm py-2 text-gray-600">
              Secure Payment via Razorpay
            </div>
          </div>
        </div>

        <h3 class="text-2xl font-semibold mb-4">Payment Details</h3>
        <div class="space-y-6">
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p class="text-gray-700 mb-2">Payment Method:</p>
            <p class="text-gray-600">UPI ID: user@razorpay</p>
          </div>

          <button
            type="button"
            @click="startPayment"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transform transition text-white py-4 rounded-xl font-semibold text-lg shadow-lg flex justify-center items-center gap-3"
            :disabled="loading"
          >
            <span v-if="loading">
              <i class="fa-solid fa-spinner fa-spin"></i> Processing...
            </span>
            <span v-else> Proceed to Pay ${{ course.price }} </span>
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <div class="animate-pulse">
          <div class="h-32 w-48 bg-gray-200 rounded-xl mb-4 mx-auto"></div>
          <div class="h-8 w-64 bg-gray-200 rounded mb-2 mx-auto"></div>
          <div class="h-6 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
definePageMeta({
  requiresAuth: true,
});

import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCourseStore } from "../../stores/courses";
import { useEnrolledCourseStore } from "../../stores/enrolledCourses";

interface Course {
  id: string;
  title: string;
  description: string;
  imgUrl: string;
  price: number;
  professor: string;
  rating: number;
  mrp?: number;
  videoUrl?: string;
  createdAt: string;
  enrolledUsers?: number;
}

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const enrolledCourseStore = useEnrolledCourseStore();
const course = ref<Course | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    loading.value = true;
    const courseId = route.params.id as string;
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const foundCourse = courseStore.courses.find((c) => c.id === courseId);
    if (!foundCourse) {
      throw new Error("Course not found");
    }

    course.value = foundCourse;
  } catch (error) {
    console.error("Failed to load course:", error);
    router.push("/courses");
  } finally {
    loading.value = false;
  }
});

const startPayment = async () => {
  if (!course.value) return;
  loading.value = true;

  try {
    const razorpay = (window as any).Razorpay;
    if (!razorpay) {
      throw new Error("Razorpay SDK not loaded");
    }

    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: course.value.price,
        currency: "INR",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    const order = await response.json();
    console.log("Created order:", order);

    const options = {
      key: "rzp_test_RHofjnm5xuFy05",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "E-Learning Platform",
      description: `Payment for ${course.value.title}`,
      handler: async function (response: any) {
        try {
          console.log("Razorpay payment response:", response);
          console.log("Response keys:", Object.keys(response));

          const paymentData = {
            razorpay_order_id: response.razorpay_order_id || response.order_id,
            razorpay_payment_id:
              response.razorpay_payment_id || response.payment_id,
            razorpay_signature:
              response.razorpay_signature || response.signature,
          };

          console.log("Extracted payment data:", paymentData);

          if (
            !paymentData.razorpay_order_id ||
            !paymentData.razorpay_payment_id ||
            !paymentData.razorpay_signature
          ) {
            console.error("Missing payment information:", {
              order_id: !!paymentData.razorpay_order_id,
              payment_id: !!paymentData.razorpay_payment_id,
              signature: !!paymentData.razorpay_signature,
            });
            throw new Error(
              "Missing payment information from Razorpay response"
            );
          }

          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
          });

          const verifyResult = await verifyResponse.json();
          console.log("Payment verification result:", verifyResult);

          if (!verifyResult.success || !verifyResult.verified) {
            throw new Error(
              verifyResult.message || "Payment verification failed"
            );
          }

          if (!course.value) {
            throw new Error("Course not found");
          }

          const courseToEnroll = {
            ...course.value,
            mrp: course.value.mrp || course.value.price,
            enrolledUsers: course.value.enrolledUsers || 0,
            enrolled: true,
            enrolledAt: new Date().toISOString(),
          };

          console.log("Enrolling course:", courseToEnroll);
          await enrolledCourseStore.enrollCourse(courseToEnroll);

          await enrolledCourseStore.fetchEnrolledCourses();

          const isEnrolled = enrolledCourseStore.isEnrolled(course.value.id);
          console.log("Enrollment verification:", isEnrolled);

          if (!isEnrolled) {
            console.error("Course enrollment verification failed");
            throw new Error("Course enrollment verification failed");
          }

          console.log(
            "Payment successful, course enrolled, navigating to My Journey"
          );
          alert(
            `Congratulations! "${course.value.title}" has been added to your journey. Start learning now!`
          );
          router.push(`/myjourney/${course.value.id}`);
        } catch (error: any) {
          console.error("Payment processing failed:", error);
          alert(
            error.message ||
              "Payment processing failed. Please contact support."
          );
          loading.value = false;
        }
      },
      prefill: {
        email: "",
        contact: "",
      },
      theme: {
        color: "#2563eb",
      },
      modal: {
        ondismiss: function () {
          loading.value = false;
        },
      },
    };

    const rzp = new razorpay(options);
    rzp.open();
  } catch (error: any) {
    console.error("Payment initialization failed:", error);
    alert("Failed to initialize payment. Please try again.");
    loading.value = false;
  }
};
</script>
<style scoped>
input {
  border: 1px solid #6b7280 !important;
}
</style>
