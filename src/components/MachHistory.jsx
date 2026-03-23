import React, { useEffect, useMemo, useState } from 'react'
import { fetchLastWeekMatches, fetchThisWeekMatches } from '../api/cricketapi'

const REFRESH_INTERVAL_MS = 30000

const buildStateBadge = (state, status) => {
  const text = `${state} ${status}`.toLowerCase()

  if (text.includes('live') || text.includes('in progress') || text.includes('innings')) {
    return {
      label: 'Live',
      className: 'bg-rose-100 text-rose-700 border border-rose-200',
    }
  }

  if (
    text.includes('complete') ||
    text.includes('won') ||
    text.includes('draw') ||
    text.includes('abandon') ||
    text.includes('stumps')
  ) {
    return {
      label: 'Complete',
      className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    }
  }

  return {
    label: 'Upcoming',
    className: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  }
}

const formatDate = (timestampMs) => {
  if (!timestampMs) return '--'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestampMs))
}

const formatTime = (timestampMs) => {
  if (!timestampMs) return '--:--'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestampMs))
}

const formatWeekRange = (startMs, endMs) => {
  if (!startMs || !endMs) return 'This week'

  const start = new Date(startMs)
  const end = new Date(endMs)

  const startText = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start)

  const endText = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(end)

  return `${startText} - ${endText}`
}

const resolveFetchError = (fetchError, fallbackMessage) =>
  fetchError?.response?.data?.message ?? fetchError?.message ?? fallbackMessage

const MatchHistoryCard = ({ match }) => {
  const badge = buildStateBadge(match.state, match.status)

  return (
    <article
      key={match.matchId}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {match.matchType || 'Cricket'} | {match.matchFormat}
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">{match.seriesName}</h3>
          <p className="text-xs text-slate-500 mt-1">{match.matchDesc}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{match.team1.short}</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{match.team1.name}</p>
          </div>
          <p className="text-sm text-slate-700 text-right">{match.team1.score}</p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{match.team2.short}</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{match.team2.name}</p>
          </div>
          <p className="text-sm text-slate-700 text-right">{match.team2.score}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">Status</p>
        <p className="text-sm font-medium text-slate-800 mt-1">{match.status}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {formatDate(match.startDateMs)} | {formatTime(match.startDateMs)}
        </span>
        <span className="truncate max-w-[60%] text-right">{match.venue}</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Match ID: {match.matchId}</p>
    </article>
  )
}

const MatchHistoryWeekPanel = ({
  title,
  subtitle,
  weekLabel,
  summaryLabel,
  matches,
  error,
  isLoading,
  tone = 'blue',
}) => {
  const toneClasses =
    tone === 'amber'
      ? {
          panelBorder: 'border-amber-200',
          panelBg: 'bg-amber-50/70',
          subLabel: 'text-amber-700',
          summaryBorder: 'border-amber-200',
          summaryBg: 'bg-amber-100/70',
          summaryLabel: 'text-amber-700',
        }
      : {
          panelBorder: 'border-blue-200',
          panelBg: 'bg-blue-50/50',
          subLabel: 'text-blue-700',
          summaryBorder: 'border-blue-200',
          summaryBg: 'bg-blue-100/70',
          summaryLabel: 'text-blue-700',
        }

  return (
    <div className={`rounded-2xl border ${toneClasses.panelBorder} ${toneClasses.panelBg} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${toneClasses.subLabel}`}>{subtitle}</p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">Week range: {weekLabel}</p>
        </div>
        <div className={`rounded-xl border ${toneClasses.summaryBorder} ${toneClasses.summaryBg} px-3 py-2 min-w-[190px]`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${toneClasses.summaryLabel}`}>Summary</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{summaryLabel}</p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          Loading weekly matches...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          API error: {error}
        </div>
      )}

      {!isLoading && !error && matches.length === 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          No matches found for this week.
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchHistoryCard key={match.matchId} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}

const MachHistory = () => {
  const [thisWeekMatches, setThisWeekMatches] = useState([])
  const [thisWeekStartMs, setThisWeekStartMs] = useState(null)
  const [thisWeekEndMs, setThisWeekEndMs] = useState(null)
  const [lastWeekMatches, setLastWeekMatches] = useState([])
  const [lastWeekStartMs, setLastWeekStartMs] = useState(null)
  const [lastWeekEndMs, setLastWeekEndMs] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [thisWeekError, setThisWeekError] = useState('')
  const [lastWeekError, setLastWeekError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('Waiting for first update')

  useEffect(() => {
    let isMounted = true
    let isRefreshing = false

    const refreshMatches = async () => {
      if (isRefreshing) return
      isRefreshing = true

      try {
        const [thisWeekResult, lastWeekResult] = await Promise.allSettled([
          fetchThisWeekMatches(),
          fetchLastWeekMatches(),
        ])

        if (!isMounted) return

        let hasSuccessfulResponse = false

        if (thisWeekResult.status === 'fulfilled') {
          setThisWeekMatches(thisWeekResult.value.matches ?? [])
          setThisWeekStartMs(thisWeekResult.value.weekStartMs ?? null)
          setThisWeekEndMs(thisWeekResult.value.weekEndMs ?? null)
          setThisWeekError('')
          hasSuccessfulResponse = true
        } else {
          setThisWeekError(resolveFetchError(thisWeekResult.reason, 'Unable to load this week match history'))
        }

        if (lastWeekResult.status === 'fulfilled') {
          setLastWeekMatches(lastWeekResult.value.matches ?? [])
          setLastWeekStartMs(lastWeekResult.value.weekStartMs ?? null)
          setLastWeekEndMs(lastWeekResult.value.weekEndMs ?? null)
          setLastWeekError('')
          hasSuccessfulResponse = true
        } else {
          setLastWeekError(resolveFetchError(lastWeekResult.reason, 'Unable to load last week match history'))
        }

        if (hasSuccessfulResponse) {
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
        isRefreshing = false
      }
    }

    refreshMatches()
    const intervalId = setInterval(refreshMatches, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  const thisWeekLabel = useMemo(
    () => formatWeekRange(thisWeekStartMs, thisWeekEndMs),
    [thisWeekStartMs, thisWeekEndMs]
  )
  const lastWeekLabel = useMemo(
    () => formatWeekRange(lastWeekStartMs, lastWeekEndMs),
    [lastWeekStartMs, lastWeekEndMs]
  )

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Match History</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              This Week + Last Week Fixtures & Results
            </h2>
            <p className="text-sm text-slate-600 mt-1">Two separate views for easier comparison</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 min-w-[230px]">
            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Weekly Summary</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {thisWeekMatches.length} this week | {lastWeekMatches.length} last week
            </p>
            <p className="text-xs text-slate-500 mt-1">Auto refresh every 30s</p>
            <p className="text-[11px] text-slate-500 mt-1">Last update: {lastUpdated}</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <MatchHistoryWeekPanel
            title="This Week Fixtures & Results"
            subtitle="Current Week"
            weekLabel={thisWeekLabel}
            summaryLabel={`${thisWeekMatches.length} matches this week`}
            matches={thisWeekMatches}
            error={thisWeekError}
            isLoading={isLoading}
            tone="blue"
          />

          <MatchHistoryWeekPanel
            title="Last Week Fixtures & Results"
            subtitle="Previous Week"
            weekLabel={lastWeekLabel}
            summaryLabel={`${lastWeekMatches.length} matches last week`}
            matches={lastWeekMatches}
            error={lastWeekError}
            isLoading={isLoading}
            tone="amber"
          />
        </div>
      </div>
    </section>
  )
}

export default MachHistory
