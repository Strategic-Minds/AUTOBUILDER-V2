"use client";

import { useEffect, useState } from "react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

/**
 * Renders a relative time string ("2d ago") on the client after hydration.
 * On the server — and during the initial client render — it outputs the same
 * deterministic absolute date that the server produced, preventing the
 * server/client text mismatch hydration error.
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => formatDate(date));

  useEffect(() => {
    setLabel(formatRelativeTime(date));
  }, [date]);

  return <span className={className}>{label}</span>;
}
