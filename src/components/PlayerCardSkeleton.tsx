import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PlayerCardSkeleton() {
  return (
    <Card className="border-[#E9ECEF]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E9ECEF] grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <Skeleton className="h-3 w-8 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-6 mx-auto" />
            <Skeleton className="h-4 w-10 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-6 mx-auto" />
            <Skeleton className="h-4 w-10 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

