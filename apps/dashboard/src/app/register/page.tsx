"use client";

import { Suspense } from "react";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FDFDFC" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2D5A3D", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
            <span style={{ fontSize: "12px", color: "#999" }}>Loading...</span>
          </div>
          <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
