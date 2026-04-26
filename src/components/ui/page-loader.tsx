import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}
