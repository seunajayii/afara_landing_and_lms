const ADMIN_COHORT_STORAGE_KEY = "afara_admin_cohort_id";

export function getAdminCohortId(): string | null {
  const queryCohortId = new URLSearchParams(window.location.search).get("cohortId");
  if (queryCohortId) return queryCohortId;

  try {
    return window.localStorage.getItem(ADMIN_COHORT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminCohortId(cohortId: string): void {
  try {
    window.localStorage.setItem(ADMIN_COHORT_STORAGE_KEY, cohortId);
  } catch {
    // The URL remains the authoritative context when storage is unavailable.
  }
}