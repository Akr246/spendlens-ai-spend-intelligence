import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Band, Goal, PersonaKey, Profile, Txn } from '../types'
import { PERSONA_BY_KEY, SEED_GOALS } from '../data/personas'
import { generateTransactions } from '../data/seed'
import { classifyAll, normaliseMerchant } from '../engine/classify'
import {
  currentObligations, goalAlignedRupees, greenAllowance, incomeStats,
  redFloor, reviewQueue, summariseMonths, topLeaks,
} from '../engine/analytics'
import { assessGoal } from '../engine/goals'
import { deriveOpeningBalance, forecast } from '../engine/forecast'
import { detectPatterns, impulseIndex } from '../engine/patterns'
import { buildNudges } from '../engine/nudges'

const STORAGE_KEY = 'spendlens.v1'

interface PersistedState {
  profile: Profile
  goals: Goal[]
  txns: Txn[]
  imported: boolean
}

function freshProfile(personaKey: PersonaKey): Profile {
  const p = PERSONA_BY_KEY[personaKey]
  return {
    personaKey,
    displayName: p.name,
    monthlyIncome: p.monthlyIncome,
    dependants: p.dependants,
    topWorry: p.worry,
    onboarded: false,
    telemetryConsent: false,
    bandOverrides: {},
    merchantOverrides: {},
    dismissedNudges: [],
    greenAllowance: null,
  }
}

function freshGoals(personaKey: PersonaKey, now = new Date()): Goal[] {
  return SEED_GOALS[personaKey].map((g, i) => ({
    id: `g${i + 1}`,
    name: g.name,
    target: g.target,
    saved: g.saved,
    templateKey: g.templateKey,
    targetDate: new Date(now.getFullYear(), now.getMonth() + g.months, 1).toISOString().slice(0, 10),
  }))
}

function freshState(personaKey: PersonaKey): PersistedState {
  return {
    profile: freshProfile(personaKey),
    goals: freshGoals(personaKey),
    txns: generateTransactions(personaKey),
    imported: false,
  }
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState('rohit')
    const parsed = JSON.parse(raw) as PersistedState
    if (!parsed?.profile?.personaKey) return freshState('rohit')
    // Demo ledgers are regenerated relative to today so the app never looks
    // stale; only imported data is genuinely persisted.
    if (!parsed.imported) parsed.txns = generateTransactions(parsed.profile.personaKey)
    return parsed
  } catch {
    return freshState('rohit')
  }
}

export function useSpendLensState() {
  const [state, setState] = useState<PersistedState>(() => load())
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* private mode */ }
  }, [state])

  const { profile, goals, txns: rawTxns, imported } = state

  const hasStudyGoal = goals.some((g) => g.templateKey === 'higher-study' || /mba|study|education|course/i.test(g.name))

  const txns = useMemo(() => classifyAll(rawTxns, profile, hasStudyGoal), [rawTxns, profile, hasStudyGoal])
  const months = useMemo(() => summariseMonths(txns), [txns])
  const obligations = useMemo(() => currentObligations(txns, now), [txns, now])
  const income = useMemo(() => {
    const s = incomeStats(months)
    return Math.round(s.variance > 0.25 ? s.conservative : s.mean) || profile.monthlyIncome
  }, [months, profile.monthlyIncome])
  const floor = useMemo(() => redFloor(months), [months])
  const allowance = useMemo(() => greenAllowance(months, profile), [months, profile])
  const leaks = useMemo(() => topLeaks(txns, months, 3, now), [txns, months, now])
  const patterns = useMemo(() => detectPatterns(txns, months, now), [txns, months, now])
  const impulse = useMemo(() => impulseIndex(patterns), [patterns])
  const assessments = useMemo(
    () => goals.map((g) => assessGoal(g, months, txns, income, now)),
    [goals, months, txns, income, now],
  )
  const openingBalance = useMemo(
    () => deriveOpeningBalance(txns, PERSONA_BY_KEY[profile.personaKey].openingBalance, now),
    [txns, profile.personaKey, now],
  )
  const projection = useMemo(
    () => forecast(txns, months, obligations, openingBalance, now),
    [txns, months, obligations, openingBalance, now],
  )
  const nudges = useMemo(
    () => buildNudges(leaks, patterns, assessments, obligations, months, profile, now),
    [leaks, patterns, assessments, obligations, months, profile, now],
  )
  const queue = useMemo(() => reviewQueue(txns), [txns])
  const gar = useMemo(() => goalAlignedRupees(months, now), [months, now])

  /* ------------------------------- actions ------------------------------- */

  const switchPersona = useCallback((key: PersonaKey) => {
    setState(() => ({ ...freshState(key), profile: { ...freshProfile(key), onboarded: true } }))
  }, [])

  const completeOnboarding = useCallback(
    (patch: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch, onboarded: true } })),
    [],
  )

  const correctTransaction = useCallback(
    (txnId: string, categoryL1: string, categoryL2: string, applyToMerchant: boolean) => {
      setState((s) => {
        const target = s.txns.find((t) => t.id === txnId)
        if (!target) return s
        const profileNext = applyToMerchant
          ? {
              ...s.profile,
              merchantOverrides: {
                ...s.profile.merchantOverrides,
                [normaliseMerchant(target.merchant)]: { categoryL1, categoryL2 },
              },
            }
          : s.profile
        const txnsNext = s.txns.map((t) =>
          t.id === txnId ? { ...t, categoryL1, categoryL2, overridden: !applyToMerchant, confidence: 1 } : t,
        )
        return { ...s, profile: profileNext, txns: txnsNext }
      })
    },
    [],
  )

  const setBandOverride = useCallback((categoryL2: string, band: Band | null) => {
    setState((s) => {
      const next = { ...s.profile.bandOverrides }
      if (band) next[categoryL2] = band
      else delete next[categoryL2]
      return { ...s, profile: { ...s.profile, bandOverrides: next } }
    })
  }, [])

  const upsertGoal = useCallback((goal: Goal) => {
    setState((s) => ({
      ...s,
      goals: s.goals.some((g) => g.id === goal.id)
        ? s.goals.map((g) => (g.id === goal.id ? goal : g))
        : [...s.goals, goal],
    }))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
  }, [])

  const dismissNudge = useCallback((id: string) => {
    setState((s) => ({ ...s, profile: { ...s.profile, dismissedNudges: [...s.profile.dismissedNudges, id] } }))
  }, [])

  const setAllowance = useCallback((value: number | null) => {
    setState((s) => ({ ...s, profile: { ...s.profile, greenAllowance: value } }))
  }, [])

  const setTelemetry = useCallback((on: boolean) => {
    setState((s) => ({ ...s, profile: { ...s.profile, telemetryConsent: on } }))
  }, [])

  const importTxns = useCallback((incoming: Txn[]) => {
    setState((s) => ({ ...s, txns: incoming, imported: true }))
  }, [])

  const resetDemo = useCallback(() => {
    setState((s) => ({ ...freshState(s.profile.personaKey), profile: { ...freshProfile(s.profile.personaKey), onboarded: true } }))
  }, [])

  const clearEverything = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setState(freshState('rohit'))
  }, [])

  return {
    now, profile, goals, txns, months, obligations, income, floor, allowance, leaks,
    patterns, impulse, assessments, projection, nudges, queue, gar, imported,
    persona: PERSONA_BY_KEY[profile.personaKey],
    actions: {
      switchPersona, completeOnboarding, correctTransaction, setBandOverride, upsertGoal,
      removeGoal, dismissNudge, setAllowance, setTelemetry, importTxns, resetDemo, clearEverything,
    },
  }
}

export type SpendLens = ReturnType<typeof useSpendLensState>

const Ctx = createContext<SpendLens | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useSpendLensState()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): SpendLens {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}
