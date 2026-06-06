import React from "react";
import { FEATURE_FLAGS } from "@/config/features";

interface ToggleProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function CurrencyFeatureToggle({ children, fallback = null }: ToggleProps) {
  if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
