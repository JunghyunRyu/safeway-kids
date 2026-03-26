import apiClient from "./client";

// ── Parent consent types ────────────────────────────────────────

export interface ConsentScope {
  service_terms: boolean;
  privacy_policy: boolean;
  child_info_collection: boolean;
  location_tracking: boolean;
  push_notification: boolean;
  marketing: boolean;
  third_party_sharing: boolean;
  health_info_sharing: boolean;
}

export interface Consent {
  id: string;
  guardian_id: string;
  child_id: string;
  consent_scope: ConsentScope;
  consent_method: string;
  granted_at: string;
  withdrawn_at: string | null;
}

export async function listConsents(): Promise<Consent[]> {
  const resp = await apiClient.get("/compliance/consents");
  return resp.data;
}

export async function createConsent(childId: string, scope: ConsentScope): Promise<Consent> {
  const resp = await apiClient.post("/compliance/consents", {
    child_id: childId,
    consent_scope: scope,
    consent_method: "app",
  });
  return resp.data;
}

export async function withdrawConsent(consentId: string): Promise<Consent> {
  const resp = await apiClient.post(`/compliance/consents/${consentId}/withdraw`, {});
  return resp.data;
}

// ── Driver/Escort consent ───────────────────────────────────────

/**
 * Check if the current driver/escort has already granted GPS consent.
 * GET /compliance/driver-consent/check -> { consented: boolean }
 */
export async function checkDriverConsent(): Promise<boolean> {
  const resp = await apiClient.get("/compliance/driver-consent/check");
  return resp.data.consented;
}

/**
 * Record the driver/escort's GPS consent.
 * POST /compliance/driver-consent
 */
export async function createDriverConsent(): Promise<void> {
  await apiClient.post("/compliance/driver-consent");
}
