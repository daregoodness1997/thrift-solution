"use client";

import { Suspense } from "react";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-cream">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-brand-primary animate-spin mx-auto mb-4" />
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
