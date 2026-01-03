import React from "react";
import { NeonCard } from "./ui/NeonCard";
import { Skeleton } from "./ui/skeleton";

export function PlaceSkeleton() {
  return (
    <NeonCard variant="default" padding="none" className="overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <Skeleton className="h-5 w-20 rounded-full" />
        
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        
        {/* Address */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Opening hours */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </NeonCard>
  );
}
