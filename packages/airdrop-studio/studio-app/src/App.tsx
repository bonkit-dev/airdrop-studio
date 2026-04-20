import { useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { AppBar } from "./components/studio/app-bar"
import { ActivityLog } from "./components/studio/activity-log"
import { TooltipProvider } from "./components/ui/tooltip"
import { InspectorPanel } from "./components/studio/inspector/inspector-panel"
import { LeftRail } from "./components/studio/left-rail"
import { PreviewCanvas, PreviewContent } from "./components/studio/preview-canvas"
import { PreviewMockProvider } from "./contexts/preview-mock-context"
import { StudioWalletProvider } from "./lib/studio-wallet-provider"
import { fetchActivityLogFromServer, useStudioStore, themePresets, type StudioStoreSnapshot } from "./lib/studio-store"
import { isLightBg } from "../../src/theme/derive"
import { useSignerSessionSync } from "./hooks/use-signer-session-sync"

const previewChannelName = "bonkit-studio-preview"

type PreviewChannelMessage =
  | { __kind: "snapshot"; data: StudioStoreSnapshot }
  | { __kind: "request" }

export function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/"
  const search = typeof window !== "undefined" ? window.location.search : ""
  const params = new URLSearchParams(search)
  if (pathname.startsWith("/preview")) {
    return params.get("embed") === "1" ? <EmbeddedPreview /> : <PreviewWindow />
  }
  return <StudioShell />
}

function StudioShell() {
  const hydrated = useStudioStore((state) => state.hydrated)
  const hydrateFromServer = useStudioStore((state) => state.hydrateFromServer)
  const snapshot = useStudioStore(
    useShallow((state) => ({
      currentSection: state.currentSection,
      previewMode: state.previewMode,
      config: state.config,
      airdrop: state.airdrop,
      workspace: state.workspace,
      artifacts: state.artifacts,
      checklist: state.checklist,
      drawerOpen: state.drawerOpen,
      previewCountdownScenario: state.previewCountdownScenario,
      completedBatches: state.completedBatches,
    })),
  )
  const channelRef = useRef<BroadcastChannel | null>(null)
  const snapshotRef = useRef<StudioStoreSnapshot>(snapshot)
  const [error, setError] = useState<string | null>(null)

  snapshotRef.current = snapshot

  useEffect(() => {
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(previewChannelName) : null
    channelRef.current = channel
    channel?.addEventListener("message", (event: MessageEvent<PreviewChannelMessage>) => {
      if (event.data?.__kind === "request") {
        try {
          channel.postMessage({ __kind: "snapshot", data: snapshotRef.current })
        } catch {}
      }
    })
    void fetch("/api/state")
      .then((response) => response.json())
      .then((payload) => hydrateFromServer(payload))
      .then(() => {
        // hydrateFromServer resets activityLog to [] — load activity entries strictly after
        // hydration to avoid a race that wiped logs on refresh.
        const activityLoad = fetchActivityLogFromServer()
          .then((entries) => {
            useStudioStore.setState({ activityLog: entries })
          })
          .catch(() => {})

        return activityLoad
      })
      .catch((reason: Error) => setError(reason.message))
    return () => {
      channel?.close()
      channelRef.current = null
    }
  }, [hydrateFromServer])

  useEffect(() => {
    try {
      channelRef.current?.postMessage({ __kind: "snapshot", data: snapshot })
    } catch {}
  }, [snapshot])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (snapshot.workspace.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [snapshot.workspace.hasUnsavedChanges])

  useSignerSessionSync()

  if (error) {
    return <div className="min-h-screen bg-background text-foreground p-6">{error}</div>
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-background text-foreground p-6">Loading studio workspace…</div>
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <AppBar />
      <StudioWalletProvider endpoint={snapshot.config.rpcUrl || "https://api.mainnet.solana.com"}>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <LeftRail />
          <PreviewCanvas />
          <InspectorPanel />
        </div>
      </StudioWalletProvider>
      <ActivityLog />
    </div>
    </TooltipProvider>
  )
}

function usePreviewChannelHydration() {
  const hydrateFromSnapshot = useStudioStore((state) => state.hydrateFromSnapshot)

  useEffect(() => {
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(previewChannelName) : null
    channel?.addEventListener("message", (event: MessageEvent<PreviewChannelMessage>) => {
      if (event.data?.__kind === "snapshot") {
        hydrateFromSnapshot(event.data.data)
      }
    })
    try {
      channel?.postMessage({ __kind: "request" })
    } catch {}
    return () => channel?.close()
  }, [hydrateFromSnapshot])
}

function PreviewWindow() {
  const hydrated = useStudioStore((state) => state.hydrated)
  usePreviewChannelHydration()
  useSyncHtmlBackground()

  return hydrated ? (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen overflow-y-auto bg-background">
        <PreviewCanvas />
      </div>
    </TooltipProvider>
  ) : (
    <div className="min-h-screen bg-background text-foreground p-6">Loading preview…</div>
  )
}

function useSyncHtmlBackground() {
  const config = useStudioStore((state) => state.config)
  useEffect(() => {
    const colors = config.useCustomColors ? config.customColors : themePresets[config.themePreset ?? "midnight"]
    const bg = colors.background
    const scheme = isLightBg(bg) ? "light" : "dark"
    document.documentElement.style.backgroundColor = bg
    document.documentElement.style.colorScheme = scheme
    document.body.style.backgroundColor = bg
  }, [config.useCustomColors, config.customColors, config.themePreset])
}

function EmbeddedPreview() {
  const hydrated = useStudioStore((state) => state.hydrated)
  usePreviewChannelHydration()
  useSyncHtmlBackground()

  return hydrated ? (
    <TooltipProvider delayDuration={150}>
      <PreviewMockProvider>
        <StudioWalletProvider endpoint={useStudioStore.getState().config.rpcUrl || "https://api.mainnet.solana.com"}>
          <style>{"html { height: 100%; } body { min-height: 100%; display: flex; flex-direction: column; margin: 0; }"}</style>
          <PreviewContent embedded />
        </StudioWalletProvider>
      </PreviewMockProvider>
    </TooltipProvider>
  ) : (
    <div className="min-h-screen bg-background text-foreground p-6">Loading preview…</div>
  )
}
