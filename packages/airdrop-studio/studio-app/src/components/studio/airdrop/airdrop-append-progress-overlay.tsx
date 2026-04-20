import { Loader2 } from "lucide-react"

import { OverlayPortal } from "../../ui/overlay-portal"
import { Progress } from "../../ui/progress"

type AirdropAppendProgressOverlayProps = {
  isAppending: boolean
  batchCurrent: number
  batchTotal: number
  progress: number
}

export function AirdropAppendProgressOverlay({
  isAppending,
  batchCurrent,
  batchTotal,
  progress,
}: AirdropAppendProgressOverlayProps) {
  if (!isAppending) return null

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm sm:px-6">
        <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
            <div>
              <p className="text-sm font-semibold">Appending recipients</p>
              <p className="text-muted-foreground text-xs">Please keep this page open until all batches finish.</p>
            </div>
          </div>
          {batchTotal > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Batch progress</span>
                <span>
                  {batchCurrent}/{batchTotal}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </OverlayPortal>
  )
}
