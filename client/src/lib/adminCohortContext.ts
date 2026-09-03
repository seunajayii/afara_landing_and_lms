import { useEffect, useState } from "react";
import { useSearch } from "wouter";

const ADMIN_COHORT_STORAGE_KEY = "afara_admin_cohort_id";
const ADMIN_COHORT_EVENT = "afara:admin-cohort-change";

export function getAdminCohortId(search = window.location.search): string | null {
  const queryCohortId = new URLSearchParams(search).get("cohortId");
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
  window.dispatchEvent(new CustomEvent(ADMIN_COHORT_EVENT, { detail: cohortId }));
}

export function adminCohortHref(path: string, cohortId: string | null | undefined): string {
  if (!cohortId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}cohortId=${encodeURIComponent(cohortId)}`;
}

export function useAdminCohortId(): string | null {
  const search = useSearch();
  const [storedCohortId, setStoredCohortId] = useState<string | null>(() => getAdminCohortId(""));

  useEffect(() => {
    const updateFromContext = (event: Event) => {
      setStoredCohortId((event as CustomEvent<string>).detail || getAdminCohortId(""));
    };
    const updateFromStorage = () => setStoredCohortId(getAdminCohortId(""));
    window.addEventListener(ADMIN_COHORT_EVENT, updateFromContext);
    window.addEventListener("storage", updateFromStorage);
    return () => {
      window.removeEventListener(ADMIN_COHORT_EVENT, updateFromContext);
      window.removeEventListener("storage", updateFromStorage);
    };
  }, []);

  return new URLSearchParams(search).get("cohortId") || storedCohortId;
}