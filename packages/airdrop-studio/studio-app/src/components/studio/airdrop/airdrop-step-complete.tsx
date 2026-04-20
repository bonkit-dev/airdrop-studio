"use client"

import { CheckCircle2 } from "lucide-react"

export function AirdropStepComplete() {
  return (
    <div className="mt-6 border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold text-foreground">Create Airdrop flow is complete</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Move to Review to generate the manifest, then Export the project snapshot.
          </p>
        </div>
      </div>
    </div>
  )
}
