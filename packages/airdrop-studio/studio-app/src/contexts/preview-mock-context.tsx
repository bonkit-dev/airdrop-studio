"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

export interface MockAllocation {
  index: number
  amount: string
  claimed: boolean
}

export type MockScenario = "multi" | "single" | "none"

/* ── Mock wallet ── */
export const MOCK_WALLET_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
export const MOCK_WALLET_SHORT = `${MOCK_WALLET_ADDRESS.slice(0, 4)}...${MOCK_WALLET_ADDRESS.slice(-4)}`
export const MOCK_SOL_BALANCE = "4.2871"

export type MockWalletName = "phantom" | "solflare" | "backpack"

export interface MockWalletOption {
  name: MockWalletName
  label: string
  icon: string
}

export const mockWalletOptions: MockWalletOption[] = [
  {
    name: "phantom",
    label: "Phantom",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128' fill='none'%3E%3Crect width='128' height='128' rx='26' fill='%23AB9FF2'/%3E%3Cpath d='M110.584 64.914H99.142c0-24.846-20.295-44.985-45.334-44.985-24.596 0-44.598 19.494-45.302 43.87-.74 25.644 21.093 47.115 46.736 47.115h2.826c22.3 0 42.673-13.088 51.078-33.443 1.64-3.973-.886-8.557-5.562-8.557Z' fill='%23FFF'/%3E%3Ccircle cx='39.404' cy='56.8' r='6.4' fill='%23AB9FF2'/%3E%3Ccircle cx='62.004' cy='56.8' r='6.4' fill='%23AB9FF2'/%3E%3C/svg%3E",
  },
  {
    name: "solflare",
    label: "Solflare",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' fill='none'%3E%3Crect width='96' height='96' rx='20' fill='%23FC8E03'/%3E%3Cpath d='M48 20L28 48l20 28 20-28L48 20Z' fill='%23FFF'/%3E%3C/svg%3E",
  },
  {
    name: "backpack",
    label: "Backpack",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96' fill='none'%3E%3Crect width='96' height='96' rx='20' fill='%23E33E3F'/%3E%3Crect x='28' y='24' width='40' height='48' rx='8' fill='%23FFF'/%3E%3Crect x='36' y='36' width='24' height='8' rx='4' fill='%23E33E3F'/%3E%3C/svg%3E",
  },
]

const scenarioSeeds: Record<MockScenario, MockAllocation[]> = {
  multi: [
    { index: 0, amount: "1,250", claimed: false },
    { index: 1, amount: "500", claimed: false },
    { index: 2, amount: "750", claimed: true },
  ],
  single: [
    { index: 0, amount: "2,000", claimed: false },
  ],
  none: [],
}

export const scenarioLabels: Record<MockScenario, string> = {
  multi: "3 Allocations",
  single: "1 Allocation",
  none: "Not Eligible",
}

type ClaimPhase = "idle" | "processing" | "done"

interface PreviewMockState {
  scenario: MockScenario
  setScenario: (s: MockScenario) => void
  eligibilityChecked: boolean
  allocations: MockAllocation[]
  selectedIndex: number | null
  claimPhase: ClaimPhase
  allClaimed: boolean
  canClaim: boolean
  checkEligibility: () => void
  selectAllocation: (index: number | null) => void
  startClaim: () => void
  reset: () => void
  // Mock wallet
  walletConnected: boolean
  walletAddress: string
  walletDialogOpen: boolean
  walletDropdownOpen: string | null
  openWalletDialog: () => void
  closeWalletDialog: () => void
  connectMockWallet: (name: MockWalletName) => void
  disconnectMockWallet: () => void
  toggleWalletDropdown: (id?: string) => void
  closeWalletDropdown: () => void
}

const PreviewMockContext = createContext<PreviewMockState>({
  scenario: "multi",
  setScenario: () => {},
  eligibilityChecked: false,
  allocations: [],
  selectedIndex: null,
  claimPhase: "idle",
  allClaimed: false,
  canClaim: false,
  checkEligibility: () => {},
  selectAllocation: () => {},
  startClaim: () => {},
  reset: () => {},
  walletConnected: false,
  walletAddress: "",
  walletDialogOpen: false,
  walletDropdownOpen: null,
  openWalletDialog: () => {},
  closeWalletDialog: () => {},
  connectMockWallet: () => {},
  disconnectMockWallet: () => {},
  toggleWalletDropdown: () => {},
  closeWalletDropdown: () => {},
})

export function usePreviewMock() {
  return useContext(PreviewMockContext)
}

export function PreviewMockProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioRaw] = useState<MockScenario>("multi")
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [allocations, setAllocations] = useState<MockAllocation[]>(scenarioSeeds.multi)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [claimPhase, setClaimPhase] = useState<ClaimPhase>("idle")

  // Mock wallet state
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)
  const [walletDropdownOpen, setWalletDropdownOpen] = useState<string | null>(null)

  const allClaimed = allocations.length > 0 && allocations.every((a) => a.claimed)
  const canClaim = eligibilityChecked && selectedIndex !== null && claimPhase === "idle" && !allClaimed

  const setScenario = useCallback((s: MockScenario) => {
    setScenarioRaw(s)
    setAllocations(scenarioSeeds[s].map((a) => ({ ...a })))
    setEligibilityChecked(false)
    setSelectedIndex(null)
    setClaimPhase("idle")
  }, [])

  const checkEligibility = useCallback(() => {
    setEligibilityChecked(true)
    // Auto-select when single allocation
    if (allocations.length === 1 && !allocations[0].claimed) {
      setSelectedIndex(allocations[0].index)
    }
  }, [allocations])

  const selectAllocation = useCallback((index: number | null) => {
    if (claimPhase !== "idle") return
    setSelectedIndex(index)
  }, [claimPhase])

  const startClaim = useCallback(() => {
    if (!canClaim || selectedIndex === null) return
    setClaimPhase("processing")
    const claimingIndex = selectedIndex
    setTimeout(() => {
      setAllocations((prev) =>
        prev.map((a) => (a.index === claimingIndex ? { ...a, claimed: true } : a)),
      )
      setClaimPhase("done")
      setSelectedIndex(null)
      setTimeout(() => setClaimPhase("idle"), 1500)
    }, 2000)
  }, [canClaim, selectedIndex])

  const reset = useCallback(() => {
    setAllocations(scenarioSeeds[scenario].map((a) => ({ ...a })))
    setEligibilityChecked(false)
    setSelectedIndex(null)
    setClaimPhase("idle")
  }, [scenario])

  // Mock wallet handlers
  const openWalletDialog = useCallback(() => setWalletDialogOpen(true), [])
  const closeWalletDialog = useCallback(() => setWalletDialogOpen(false), [])
  const connectMockWallet = useCallback((_name: MockWalletName) => {
    setWalletConnected(true)
    setWalletAddress(MOCK_WALLET_ADDRESS)
    setWalletDialogOpen(false)
  }, [])
  const disconnectMockWallet = useCallback(() => {
    setWalletConnected(false)
    setWalletAddress("")
    setWalletDropdownOpen(null)
    // Reset claim flow — real apps require re-check after reconnect
    setEligibilityChecked(false)
    setSelectedIndex(null)
    setClaimPhase("idle")
  }, [])
  const toggleWalletDropdown = useCallback((id = "header") => setWalletDropdownOpen((prev) => prev === id ? null : id), [])
  const closeWalletDropdown = useCallback(() => setWalletDropdownOpen(null), [])

  const value = useMemo(() => ({
    scenario,
    setScenario,
    eligibilityChecked,
    allocations,
    selectedIndex,
    claimPhase,
    allClaimed,
    canClaim,
    checkEligibility,
    selectAllocation,
    startClaim,
    reset,
    walletConnected,
    walletAddress,
    walletDialogOpen,
    walletDropdownOpen,
    openWalletDialog,
    closeWalletDialog,
    connectMockWallet,
    disconnectMockWallet,
    toggleWalletDropdown,
    closeWalletDropdown,
  }), [
    scenario, setScenario, eligibilityChecked, allocations, selectedIndex,
    claimPhase, allClaimed, canClaim, checkEligibility, selectAllocation, startClaim, reset,
    walletConnected, walletAddress, walletDialogOpen, walletDropdownOpen,
    openWalletDialog, closeWalletDialog, connectMockWallet, disconnectMockWallet,
    toggleWalletDropdown, closeWalletDropdown,
  ])

  return (
    <PreviewMockContext.Provider value={value}>
      {children}
    </PreviewMockContext.Provider>
  )
}
