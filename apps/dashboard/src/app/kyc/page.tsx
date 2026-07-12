"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { Card, ColorfulBadge, ColorBar, FadeInUp } from "@thrift/ui";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

const ID_TYPES = [
  { value: "bvn", label: "Bank Verification Number (BVN)", placeholder: "Enter your 11-digit BVN", pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  { value: "nin", label: "National Identification Number (NIN)", placeholder: "Enter your 11-digit NIN", pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  { value: "drivers_license", label: "Driver's License", placeholder: "Enter license number", pattern: null, minLength: 5, maxLength: 20 },
  { value: "international_passport", label: "International Passport", placeholder: "Enter passport number", pattern: null, minLength: 5, maxLength: 20 },
  { value: "voter_card", label: "Voter's Card", placeholder: "Enter voter card number", pattern: null, minLength: 5, maxLength: 20 },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string; description: string }> = {
  verified: { label: "Verified", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3", description: "Your identity has been verified. You now have full access to all platform features." },
  pending: { label: "Submitted", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", description: "Your KYC has been submitted and is awaiting review. This usually takes 1-2 business days." },
  under_review: { label: "Under Review", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", description: "Your submission is being actively reviewed by our team. You will be notified once complete." },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "M6 18L18 6M6 6l12 12", description: "Your submission was rejected. Please review the reason below and resubmit." },
  expired: { label: "Expired", color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", description: "Your KYC submission has expired. Please submit a new one." },
};

interface UploadedFile {
  file: File;
  preview: string;
  purpose: string;
}

interface KycData {
  id?: string;
  status: string;
  idType?: string;
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  submittedAt?: string;
  documents?: { id: string; fileUrl: string; fileName: string; purpose: string }[];
  auditLogs?: { action: string; notes?: string; createdAt: string }[];
}

export default function KycPage() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [step, setStep] = useState(1);
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idDocumentFile, setIdDocumentFile] = useState<UploadedFile | null>(null);
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null);

  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => { if (data && data.name) setCfg((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/kyc`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => { if (data?.data) setKycData(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, API_URL]);

  const handleFileSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: UploadedFile | null) => void,
    purpose: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and PDF files are allowed");
      return;
    }

    setError("");
    const preview = URL.createObjectURL(file);
    setFile({ file, preview, purpose });
  }, []);

  const removeFile = useCallback((setFile: (file: UploadedFile | null) => void) => {
    setFile(null);
  }, []);

  const validateIdNumber = (): string | null => {
    const idTypeConfig = ID_TYPES.find((t) => t.value === idType);
    if (!idTypeConfig) return "Invalid ID type";
    if (idNumber.length < idTypeConfig.minLength || idNumber.length > idTypeConfig.maxLength) {
      return `ID number must be between ${idTypeConfig.minLength} and ${idTypeConfig.maxLength} characters`;
    }
    if (idTypeConfig.pattern && !idTypeConfig.pattern.test(idNumber)) {
      return `Invalid format for ${idTypeConfig.label}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateIdNumber();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!idDocumentFile) {
      setError("Please upload your ID document");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let idDocumentUrl = "";
      let selfieUrl = "";

      if (idDocumentFile) {
        idDocumentUrl = idDocumentFile.preview;
      }
      if (selfieFile) {
        selfieUrl = selfieFile.preview;
      }

      const res = await fetch(`${API_URL}/api/kyc`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          idType,
          idNumber,
          idDocumentUrl,
          selfieUrl,
          documents: [
            {
              fileUrl: idDocumentUrl,
              fileType: idDocumentFile.file.type,
              fileName: idDocumentFile.file.name,
              fileSize: idDocumentFile.file.size,
              purpose: "id_document",
            },
            ...(selfieFile
              ? [{
                  fileUrl: selfieUrl,
                  fileType: selfieFile.file.type,
                  fileName: selfieFile.file.name,
                  fileSize: selfieFile.file.size,
                  purpose: "selfie",
                }]
              : []),
          ],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to submit KYC");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setKycData(data.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep2 = idType.length > 0;
  const canProceedStep3 = idNumber.length >= 5;
  const canProceedStep4 = idDocumentFile !== null;

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
        <ColorBar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <span style={{ fontSize: "12px", color: "#999" }}>Loading KYC status...</span>
        </div>
      </div>
    );
  }

  const isVerified = kycData?.status === "verified";
  const isPendingOrReview = kycData?.status === "pending" || kycData?.status === "under_review";
  const showForm = !kycData || kycData.status === "none" || kycData.status === "rejected" || kycData.status === "expired";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)" }}>
      <PageHeader
        badgeLabel="Identity Verification"
        heading="KYC"
        accentText="Verification"
        description="Verify your identity to access all platform features and build trust in your circles."
      />

      {/* Status Banner */}
      {kycData && kycData.status !== "none" && !submitted && (
        <FadeInUp delay={200}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
            {(() => {
              const sc = STATUS_CONFIG[kycData.status] || STATUS_CONFIG.pending;
              return (
                <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={sc.icon} />
                    </svg>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: sc.color }}>{sc.label}</span>
                      <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem" }}>{sc.description}</span>
                      {kycData.idType && (
                        <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.25rem" }}>
                          {ID_TYPES.find((t) => t.value === kycData.idType)?.label} ending in ...{kycData.idNumber?.slice(-4)}
                        </span>
                      )}
                    </div>
                  </div>
                  {kycData.status === "rejected" && kycData.rejectionReason && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "#FFFFFF", border: "1px solid #FECACA" }}>
                      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#DC2626", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>Rejection Reason</span>
                      <span style={{ fontSize: "12px", color: "#2D2D2D" }}>{kycData.rejectionReason}</span>
                    </div>
                  )}
                  {kycData.verifiedAt && (
                    <span style={{ fontSize: "10px", color: "#059669", display: "block", marginTop: "0.5rem" }}>
                      Verified on {new Date(kycData.verifiedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}
                  {kycData.submittedAt && (
                    <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.25rem" }}>
                      Submitted on {new Date(kycData.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })()}
          </Card>
        </FadeInUp>
      )}

      {/* Success Banner */}
      {submitted && (
        <FadeInUp delay={200}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#2563EB" }}>KYC Submitted Successfully</span>
                <span style={{ fontSize: "11px", color: "#717171", display: "block", marginTop: "0.125rem" }}>
                  Your identity verification has been submitted. You will be notified once reviewed (usually 1-2 business days).
                </span>
              </div>
            </div>
          </Card>
        </FadeInUp>
      )}

      {/* KYC Form */}
      {(showForm || kycData?.status === "rejected" || kycData?.status === "expired") && !submitted && (
        <FadeInUp delay={300}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
            {/* Progress Steps */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
              {["ID Type", "ID Details", "Document", "Review"].map((label, i) => {
                const num = i + 1;
                const isActive = step === num;
                const isDone = step > num;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700,
                      backgroundColor: isDone ? "#059669" : isActive ? cfg.colors.primary : "#F0F0F0",
                      color: isDone || isActive ? "#ffffff" : "#999", transition: "all 0.2s ease",
                    }}>
                      {isDone ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg> : num}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 400, color: isActive ? "#2D2D2D" : "#999" }}>{label}</span>
                    {i < 3 && <div style={{ width: "24px", height: "1px", backgroundColor: isDone ? "#059669" : "#E5E7EB" }} />}
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 500, marginBottom: "1.5rem" }}>
                {error}
              </div>
            )}

            {/* Step 1: ID Type */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.25rem" }}>Select ID Type</h2>
                <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>Choose the identity document you want to verify with.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {ID_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setIdType(t.value)} style={{
                      padding: "0.875rem 1rem", borderRadius: "0.75rem",
                      border: `1px solid ${idType === t.value ? cfg.colors.primary : "#EAEAEA"}`,
                      backgroundColor: idType === t.value ? `${cfg.colors.primary}0A` : "#ffffff",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                    }}
                      onMouseEnter={(e) => { if (idType !== t.value) e.currentTarget.style.borderColor = "#CCC"; }}
                      onMouseLeave={(e) => { if (idType !== t.value) e.currentTarget.style.borderColor = "#EAEAEA"; }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: idType === t.value ? 600 : 400, color: idType === t.value ? cfg.colors.primary : "#2D2D2D" }}>{t.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => idType && setStep(2)} disabled={!idType} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
                  cursor: idType ? "pointer" : "not-allowed", backgroundColor: idType ? cfg.colors.primary : "#E5E7EB",
                  color: "#ffffff", border: "none", marginTop: "1.5rem", transition: "all 0.2s ease",
                }}>Continue</button>
              </div>
            )}

            {/* Step 2: ID Number */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.25rem" }}>Enter ID Number</h2>
                <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>{ID_TYPES.find((t) => t.value === idType)?.label}</p>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.375rem" }}>ID Number</label>
                  <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value.toUpperCase())} placeholder={ID_TYPES.find((t) => t.value === idType)?.placeholder}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                  />
                  {idNumber && ID_TYPES.find((t) => t.value === idType)?.pattern && (
                    <span style={{ fontSize: "10px", color: (ID_TYPES.find((t) => t.value === idType)!.pattern as RegExp | null)?.test(idNumber) ? "#059669" : "#DC2626", display: "block", marginTop: "0.25rem" }}>
                      {(ID_TYPES.find((t) => t.value === idType)!.pattern as RegExp | null)?.test(idNumber) ? "Valid format" : "Invalid format"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: "transparent", color: "#717171", border: "1px solid #EAEAEA" }}>Back</button>
                  <button onClick={() => { const err = validateIdNumber(); if (err) { setError(err); } else { setError(""); setStep(3); } }}
                    disabled={idNumber.length < 5}
                    style={{ flex: 2, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: idNumber.length >= 5 ? "pointer" : "not-allowed", backgroundColor: idNumber.length >= 5 ? cfg.colors.primary : "#E5E7EB", color: "#ffffff", border: "none" }}>Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.25rem" }}>Upload Documents</h2>
                <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>Upload a clear photo or scan of your ID document. Max 5MB, JPEG/PNG/WebP/PDF.</p>

                {/* ID Document Upload */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.375rem" }}>
                    ID Document <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input ref={idFileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleFileSelect(e, setIdDocumentFile, "id_document")} style={{ display: "none" }} />
                  {idDocumentFile ? (
                    <div style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #A7F3D0", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {idDocumentFile.file.type.startsWith("image/") ? (
                        <img src={idDocumentFile.preview} alt="ID Preview" style={{ width: "48px", height: "48px", borderRadius: "0.5rem", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "0.5rem", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idDocumentFile.file.name}</span>
                        <span style={{ fontSize: "10px", color: "#059669" }}>{(idDocumentFile.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button onClick={() => removeFile(setIdDocumentFile)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#DC2626" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => idFileRef.current?.click()} style={{ width: "100%", padding: "2rem", borderRadius: "0.75rem", border: "2px dashed #D1D5DB", backgroundColor: "#FAFAFA", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; e.currentTarget.style.backgroundColor = `${cfg.colors.primary}05`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} style={{ margin: "0 auto 0.5rem" }}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span style={{ fontSize: "12px", color: "#717171", display: "block" }}>Click to upload ID document</span>
                      <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.25rem" }}>JPEG, PNG, WebP, or PDF up to 5MB</span>
                    </button>
                  )}
                </div>

                {/* Selfie Upload */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.375rem" }}>
                    Selfie Photo <span style={{ fontWeight: 400, color: "#999", textTransform: "none", letterSpacing: "normal" }}>(recommended)</span>
                  </label>
                  <input ref={selfieFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, setSelfieFile, "selfie")} style={{ display: "none" }} />
                  {selfieFile ? (
                    <div style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #A7F3D0", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <img src={selfieFile.preview} alt="Selfie" style={{ width: "48px", height: "48px", borderRadius: "0.5rem", objectFit: "cover" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#2D2D2D", display: "block" }}>{selfieFile.file.name}</span>
                        <span style={{ fontSize: "10px", color: "#059669" }}>{(selfieFile.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button onClick={() => removeFile(setSelfieFile)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#DC2626" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => selfieFileRef.current?.click()} style={{ width: "100%", padding: "1.5rem", borderRadius: "0.75rem", border: "2px dashed #D1D5DB", backgroundColor: "#FAFAFA", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.colors.primary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} style={{ margin: "0 auto 0.375rem" }}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span style={{ fontSize: "12px", color: "#717171", display: "block" }}>Click to upload selfie</span>
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: "transparent", color: "#717171", border: "1px solid #EAEAEA" }}>Back</button>
                  <button onClick={() => { if (!idDocumentFile) { setError("Please upload your ID document"); } else { setError(""); setStep(4); } }}
                    style={{ flex: 2, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: idDocumentFile ? "pointer" : "not-allowed", backgroundColor: idDocumentFile ? cfg.colors.primary : "#E5E7EB", color: "#ffffff", border: "none" }}>Review</button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.25rem" }}>Review & Submit</h2>
                <p style={{ fontSize: "12px", color: "#717171", marginBottom: "1.5rem" }}>Please verify your details before submitting.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "ID Type", value: ID_TYPES.find((t) => t.value === idType)?.label || idType },
                    { label: "ID Number", value: `${idNumber.slice(0, 3)}****${idNumber.slice(-2)}`, mono: true },
                    { label: "ID Document", value: idDocumentFile?.file.name || "Not provided" },
                    { label: "Selfie", value: selfieFile?.file.name || "Not provided" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "#FAFAFA" }}>
                      <span style={{ fontSize: "11px", color: "#717171", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#2D2D2D", fontFamily: item.mono ? "'JetBrains Mono', monospace" : "inherit", textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {idDocumentFile && idDocumentFile.file.type.startsWith("image/") && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#999", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>Document Preview</span>
                    <img src={idDocumentFile.preview} alt="ID Document" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "0.75rem", border: "1px solid #EAEAEA" }} />
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setStep(3)} style={{ flex: 1, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", backgroundColor: "transparent", color: "#717171", border: "1px solid #EAEAEA" }}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting} style={{
                    flex: 2, padding: "0.75rem", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer", backgroundColor: submitting ? "#9CA3AF" : "#059669",
                    color: "#ffffff", border: "none", opacity: submitting ? 0.7 : 1, transition: "all 0.2s ease",
                  }}>
                    {submitting ? "Submitting..." : "Submit KYC"}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </FadeInUp>
      )}

      {/* Audit Trail */}
      {kycData?.auditLogs && kycData.auditLogs.length > 0 && !submitted && (
        <FadeInUp delay={350}>
          <Card padding="1.5rem" style={{ marginBottom: "2rem" }}>
            <ColorfulBadge label="Activity Log" color={cfg.colors.accent} />
            <div style={{ marginTop: "1rem" }}>
              {kycData.auditLogs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem 0", borderBottom: i < kycData.auditLogs!.length - 1 ? "1px solid #F0F0F0" : "none" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: cfg.colors.primary, marginTop: "5px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "#2D2D2D", textTransform: "capitalize" }}>{log.action.replace(/_/g, " ")}</span>
                    {log.notes && <span style={{ fontSize: "10px", color: "#717171", display: "block", marginTop: "0.125rem" }}>{log.notes}</span>}
                    <span style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "0.125rem" }}>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeInUp>
      )}

      {/* Info Card */}
      <FadeInUp delay={400}>
        <Card padding="1.5rem">
          <ColorfulBadge label="Why KYC?" color={cfg.colors.accent} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {[
              { title: "Secure Transactions", desc: "Verify your identity for safe contributions and payouts." },
              { title: "Build Trust", desc: "Verified members earn higher trust scores in circles." },
              { title: "Regulatory Compliance", desc: "Meet Nigerian financial regulations for savings platforms." },
              { title: "Faster Processing", desc: "Verified users get priority processing for withdrawals." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#FAFAFA" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#2D2D2D", marginBottom: "0.25rem" }}>{item.title}</h3>
                <p style={{ fontSize: "11px", color: "#717171", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </FadeInUp>
    </div>
  );
}
