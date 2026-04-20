"use client"

import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
  WalletMinimal,
} from "lucide-react"
import { RECIPIENTS_PER_APPEND, type OnchainAppendBatchDraft } from "../../../lib/airdrop-batch-types"
import { parseRecipientsWithValidation, type RecipientDraft } from "../../../lib/airdrop-utils"
import { useStudioStore } from "../../../lib/studio-store"
import {
  derivePendingAllocation,
  deriveRegisteredAllocation,
  deriveRegisteredRecipientCount,
  deriveRegisteredUniqueWalletCount,
} from "../../../lib/airdrop-allocation"
import { cn } from "../../../lib/utils"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Field, FieldGroup, FieldLabel } from "../../ui/field"
import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { StatCard } from "./stat-card"
import { AirdropAppendConfirmDialog } from "./airdrop-append-confirm-dialog"
import { AirdropBatchDetailsDialog } from "./airdrop-batch-details-dialog"

type RecipientInputTab = "quick" | "upload" | "paste"

interface AirdropStepRecipientsProps {
  recipientsCount: number
  uniqueRecipientsCount: number
  connected: boolean
  isAppending: boolean
  batchDraft: OnchainAppendBatchDraft | null
  completedBatches: OnchainAppendBatchDraft[]
  tokenDecimals: number
  onStartAppend: () => void
  onResumeAppend: () => void
  onRetryFailed: () => void
  onDiscardBatch: () => void
  onContinue?: () => void
}

export function AirdropStepRecipients({
  recipientsCount,
  uniqueRecipientsCount,
  connected,
  isAppending,
  batchDraft,
  completedBatches,
  tokenDecimals,
  onStartAppend,
  onResumeAppend,
  onRetryFailed,
  onDiscardBatch,
  onContinue,
}: AirdropStepRecipientsProps) {
  const { config, airdrop, removeRecipient, updateAirdrop } = useStudioStore()
  const isStepLocked = Boolean(airdrop.depositSignature)
  const [activeTab, setActiveTab] = useState<RecipientInputTab>("quick")
  const [quickAddresses, setQuickAddresses] = useState("")
  const [quickAmount, setQuickAmount] = useState("")
  const [pasteCsv, setPasteCsv] = useState("")
  const [importError, setImportError] = useState<string | null>(null)
  const [parseSummary, setParseSummary] = useState<{
    totalCount: number
    invalidCount: number
    duplicateCount: number
    truncatedCount: number
    errors: string[]
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [detailsBatches, setDetailsBatches] = useState<OnchainAppendBatchDraft[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const appendRecipients = (recipients: RecipientDraft[]) => {
    updateAirdrop("recipients", [...airdrop.recipients, ...recipients])
  }

  const handleApplyQuickInput = () => {
    const addresses = quickAddresses
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (!addresses.length || !quickAmount.trim()) {
      setImportError("Add at least one wallet address and one shared amount.")
      setParseSummary(null)
      return
    }

    const csvText = addresses.map((addr) => `${addr},${quickAmount.trim()}`).join("\n")
    const summary = parseRecipientsWithValidation(csvText, tokenDecimals)
    setParseSummary({
      totalCount: summary.totalCount,
      invalidCount: summary.invalidCount,
      duplicateCount: summary.duplicateCount,
      truncatedCount: summary.truncatedCount,
      errors: summary.errors,
    })
    if (summary.totalCount === 0) {
      setImportError("No valid recipients found.")
      return
    }
    appendRecipients(summary.recipients)
    setQuickAddresses("")
    setQuickAmount("")
    setImportError(null)
  }

  const handleParsePastedCsv = () => {
    const summary = parseRecipientsWithValidation(pasteCsv, tokenDecimals)
    setParseSummary({
      totalCount: summary.totalCount,
      invalidCount: summary.invalidCount,
      duplicateCount: summary.duplicateCount,
      truncatedCount: summary.truncatedCount,
      errors: summary.errors,
    })
    if (!summary.totalCount) {
      setImportError("No valid `wallet_address,amount` rows were found.")
      return
    }
    appendRecipients(summary.recipients)
    setPasteCsv("")
    setImportError(null)
  }

  const processFile = async (file: File) => {
    try {
      const text = await file.text()
      const summary = parseRecipientsWithValidation(text, tokenDecimals)
      setParseSummary({
        totalCount: summary.totalCount,
        invalidCount: summary.invalidCount,
        duplicateCount: summary.duplicateCount,
        truncatedCount: summary.truncatedCount,
        errors: summary.errors,
      })
      if (!summary.totalCount) {
        setImportError("The CSV did not contain any valid recipient rows.")
        return
      }
      appendRecipients(summary.recipients)
      setImportError(null)
    } catch {
      setImportError("Failed to read the file.")
    }
  }

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
    event.target.value = ""
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  // Completed batch summary
  const totalRegistered = completedBatches.reduce((sum, b) => sum + b.totalRecipients, 0)
  const totalBatchCount = completedBatches.reduce((sum, b) => sum + b.chunks.length, 0)
  const hasCompletedBatches = completedBatches.length > 0

  // Batch derived values
  const batchTotal = batchDraft?.chunks.length ?? 0
  const batchSuccess = batchDraft?.chunks.filter((c) => c.status === "success").length ?? 0
  const batchFailed = batchDraft?.chunks.filter((c) => c.status === "failed").length ?? 0
  const batchPending = batchDraft?.chunks.filter((c) => c.status === "pending").length ?? 0
  const hasIncompleteBatch = Boolean(batchDraft && !isAppending && (batchFailed > 0 || batchPending > 0))
  const batchCount = Math.ceil(recipientsCount / RECIPIENTS_PER_APPEND)

  const registeredCount = deriveRegisteredRecipientCount(completedBatches)
  const registeredUnique = deriveRegisteredUniqueWalletCount(completedBatches)
  const registeredAllocation = deriveRegisteredAllocation(completedBatches)
  const pendingAllocation = derivePendingAllocation(airdrop.recipients)
  const pendingCount = recipientsCount
  const tokenSymbol = airdrop.tokenSymbol || ""
  const recipientsHint = pendingCount > 0
    ? `${registeredUnique.toLocaleString()} unique registered · ${uniqueRecipientsCount.toLocaleString()} pending unique`
    : `${registeredUnique.toLocaleString()} unique wallets`

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Recipients"
          value={registeredCount.toLocaleString()}
          delta={pendingCount > 0 ? pendingCount.toLocaleString() : undefined}
          hint={recipientsHint}
        />
        <StatCard
          label="Allocation"
          value={`${registeredAllocation} ${tokenSymbol}`.trim()}
          delta={pendingAllocation !== "0" ? `${pendingAllocation} ${tokenSymbol}`.trim() : undefined}
        />
        {hasCompletedBatches ? (
          <button
            type="button"
            className="border border-success/30 bg-success/5 p-4 text-left transition-colors hover:bg-success/10"
            onClick={() => setDetailsBatches(completedBatches)}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <p className="text-xs uppercase tracking-[0.18em] text-success">Registered</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {totalRegistered.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalBatchCount} tx in {completedBatches.length} round(s) — View details
            </p>
          </button>
        ) : (
          <StatCard label="Registered" value="—" hint="No batches registered yet" />
        )}
      </div>

      {/* Continue CTA when recipients registered */}
      {hasCompletedBatches && onContinue ? (
        <div className="border border-success/30 bg-success/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">Recipients registered</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalRegistered.toLocaleString()} recipients registered on-chain. You can add more or continue to deposit.
                </p>
              </div>
            </div>
            <Button type="button" size="sm" className="shrink-0 gap-1.5" onClick={onContinue}>
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Validation summary */}
      {parseSummary &&
      (parseSummary.invalidCount > 0 || parseSummary.duplicateCount > 0 || parseSummary.truncatedCount > 0) ? (
        <div className="border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Import Summary</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>{parseSummary.totalCount.toLocaleString()} valid recipients imported</li>
                {parseSummary.invalidCount > 0 ? (
                  <li className="text-destructive">{parseSummary.invalidCount} invalid rows skipped</li>
                ) : null}
                {parseSummary.duplicateCount > 0 ? (
                  <li>{parseSummary.duplicateCount} duplicate addresses removed (within this import)</li>
                ) : null}
                {parseSummary.truncatedCount > 0 ? (
                  <li>{parseSummary.truncatedCount} amounts had decimals truncated</li>
                ) : null}
              </ul>
              {parseSummary.errors.length > 0 ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Show {parseSummary.errors.length} error(s)
                  </summary>
                  <ul className="mt-1 max-h-32 overflow-y-auto space-y-0.5 text-xs text-destructive">
                    {parseSummary.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseSummary.errors.length > 20 ? <li>...and {parseSummary.errors.length - 20} more</li> : null}
                  </ul>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Incomplete batch recovery card */}
      {hasIncompleteBatch && batchDraft ? (
        <div className="border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Unfinished recipient registration detected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {batchSuccess}/{batchTotal} batches completed, {batchFailed} failed, {batchPending} pending.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {batchPending > 0 ? (
                  <Button type="button" size="sm" className="gap-2" onClick={onResumeAppend}>
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </Button>
                ) : null}
                {batchFailed > 0 ? (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onRetryFailed}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry Failed
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDetailsBatches(batchDraft ? [batchDraft] : [])}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={onDiscardBatch}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Discard
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isStepLocked ? (
        <div className="border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">Recipients locked</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Deposit has been completed. Recipients can no longer be modified.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <fieldset disabled={isStepLocked} className={cn(isStepLocked && "opacity-60")}>
        <div className="space-y-6">
          <div className="border border-border bg-muted/20 p-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {(["quick", "upload", "paste"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                  onClick={() => {
                    setActiveTab(tab)
                    setImportError(null)
                    setParseSummary(null)
                  }}
                >
                  {tab === "quick" ? "Quick Input" : tab === "upload" ? "Upload CSV" : "Paste CSV"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
            <div className="space-y-4">
              {activeTab === "quick" ? (
                <div className="grid gap-5">
                  <Field>
                    <FieldLabel>Wallet List</FieldLabel>
                    <Textarea
                      value={quickAddresses}
                      onChange={(event) => setQuickAddresses(event.target.value)}
                      rows={12}
                      placeholder={`wallet_address\nwallet_address\nwallet_address`}
                      className="font-mono text-xs"
                    />
                  </Field>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Amount For All Wallets</FieldLabel>
                      <Input
                        value={quickAmount}
                        onChange={(event) => setQuickAmount(event.target.value)}
                        placeholder="100"
                      />
                    </Field>
                    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleApplyQuickInput}>
                      <Plus className="h-4 w-4" />
                      Apply Quick Input
                    </Button>
                  </FieldGroup>
                </div>
              ) : null}

              {activeTab === "upload" ? (
                <div
                  className={cn(
                    "border-2 border-dashed p-8 text-center transition-colors",
                    isDragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
                  )}
                  onDrop={(e) => void handleDrop(e)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <div
                    className={cn(
                      "mx-auto flex h-14 w-14 items-center justify-center rounded-lg transition-colors",
                      isDragOver ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground",
                    )}
                  >
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-base font-medium text-foreground">
                    {isDragOver ? "Drop CSV file here" : "Drag & drop CSV or click to upload"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">CSV format: wallet_address,amount</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 gap-2"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              ) : null}

              {activeTab === "paste" ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Paste CSV</FieldLabel>
                    <Textarea
                      value={pasteCsv}
                      onChange={(event) => setPasteCsv(event.target.value)}
                      rows={12}
                      placeholder={`wallet_address,amount\nwallet_address,amount`}
                      className="font-mono text-xs"
                    />
                  </Field>
                  <Button type="button" variant="outline" className="w-fit gap-2" onClick={handleParsePastedCsv}>
                    <Check className="h-4 w-4" />
                    Parse CSV
                  </Button>
                </FieldGroup>
              ) : null}

              {importError ? <p className="text-sm text-destructive">{importError}</p> : null}

              {/* Register recipients action */}
              {airdrop.airdropAddress && airdrop.recipients.length > 0 && !isStepLocked ? (
                <div className="border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Register Recipients On-Chain</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submit {airdrop.recipients.length} recipient(s) across {batchCount} transaction(s).
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full gap-2"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!airdrop.airdropAddress || !airdrop.recipients.length || isAppending || !connected}
                  >
                    {!connected ? <WalletMinimal className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {!connected ? "Connect Wallet to Register" : "Register Recipients"}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Recipient List</h3>
                <div className="flex items-center gap-2">
                  {airdrop.recipients.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => updateAirdrop("recipients", [])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  ) : null}
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {recipientsCount} rows
                  </Badge>
                </div>
              </div>
              <div className="overflow-hidden border border-border">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_52px] border-b border-border bg-muted/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Wallet</span>
                  <span>Amount</span>
                  <span className="text-right">Edit</span>
                </div>
                <div className="max-h-128 overflow-y-auto">
                  {airdrop.recipients.length ? (
                    airdrop.recipients.map((recipient, index) => (
                      <div
                        key={`${recipient.address}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-3 border-b border-border/80 px-4 py-3 text-sm last:border-b-0"
                      >
                        <span className="truncate font-mono text-xs text-foreground">{recipient.address}</span>
                        <span className="truncate text-foreground">{recipient.amount}</span>
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRecipient(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No recipients imported yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Confirm dialog */}
      <AirdropAppendConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        recipientCount={recipientsCount}
        batchCount={batchCount}
        onConfirm={onStartAppend}
      />

      {/* Batch details dialog */}
      <AirdropBatchDetailsDialog
        open={detailsBatches.length > 0}
        onOpenChange={(open) => {
          if (!open) setDetailsBatches([])
        }}
        batches={detailsBatches}
        cluster={config.network}
      />
    </div>
  )
}
