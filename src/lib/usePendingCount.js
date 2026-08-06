"use client";

import { useEffect, useState } from "react";
import {
  getPendingCount,
  setPendingCount,
  subscribePendingCount,
} from "@/lib/pendingStore";
import { fetchDashboardSummary } from "@/lib/dashboardApi";
import { isStaffRole } from "@/lib/roles";

/**
 * Live pending broker/approval count for staff UI badges.
 * Optionally polls summary on mount when `fetchOnMount` is true.
 */
export function usePendingCount({
  enabled = true,
  fetchOnMount = false,
} = {}) {
  const [pending, setPending] = useState(getPendingCount);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribePendingCount(setPending);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !fetchOnMount) return undefined;
    let alive = true;
    (async () => {
      try {
        const data = await fetchDashboardSummary();
        if (!alive) return;
        setPendingCount(data?.brokers?.pending ?? 0);
      } catch {
        /* keep last */
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled, fetchOnMount]);

  return pending;
}

export function publishPendingFromSummary(data) {
  setPendingCount(data?.brokers?.pending ?? 0);
}

export function useStaffPendingCount(user, { fetchOnMount = true } = {}) {
  return usePendingCount({
    enabled: isStaffRole(user?.role),
    fetchOnMount,
  });
}
