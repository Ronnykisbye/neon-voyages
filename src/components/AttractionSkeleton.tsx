import React from "react";
import { NeonCard } from "./ui/NeonCard";
import { Skeleton } from "./ui/skeleton";

export function AttractionSkeleton() {
  return (
    <NeonCard variant="interactive" padding="none" className="overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Address */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Opening hours */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Sources */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </NeonCard>
  );
}
