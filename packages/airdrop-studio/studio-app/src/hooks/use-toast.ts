import * as React from "react"
import type { ToastProps } from "../components/ui/toast"

const TOAST_REMOVE_DELAY = 3500

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

const actionTypes = {
  UPSERT_TOAST: "UPSERT_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | { type: typeof actionTypes.UPSERT_TOAST; toast: ToasterToast }
  | { type: typeof actionTypes.DISMISS_TOAST; toastId?: string }
  | { type: typeof actionTypes.REMOVE_TOAST; toastId?: string }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function clearRemoveTimeout(toastId: string) {
  const existing = toastTimeouts.get(toastId)
  if (existing) {
    clearTimeout(existing)
    toastTimeouts.delete(toastId)
  }
}

function addToRemoveQueue(toastId: string) {
  clearRemoveTimeout(toastId)
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.UPSERT_TOAST: {
      // Replace any existing toast — only one toast on screen at a time
      for (const existing of state.toasts) {
        clearRemoveTimeout(existing.id)
      }
      return { ...state, toasts: [action.toast] }
    }
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId)
      else state.toasts.forEach((t) => addToRemoveQueue(t.id))
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)),
      }
    }
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type Toast = Omit<ToasterToast, "id">

function toast(props: Toast) {
  const id = genId()
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
  dispatch({
    type: actionTypes.UPSERT_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })
  return { id, dismiss }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }
