import React from "react";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
);
