import React, { useEffect, useState } from 'react'
import { fetchLiveMatchBundle } from '../api/cricketapi'

const POLL_INTERVAL_MS = 15000

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getFormatOverLimit = (format) => {
  const normalized = String(format ?? '').toUpperCase()
  if (normalized.includes('T20')) return 20
  if (normalized.includes('ODI') || normalized.includes('ONE DAY')) return 50
  return null
}

const oversToBalls = (overs) => {
  if (overs === undefined || overs === null) return 0

  const value = String(overs)
  if (!value.includes('.')) {
    const fullOvers = Number(value)
    return Number.isFinite(fullOvers) ? fullOvers * 6 : 0
  }

  const [wholePart, ballPart = '0'] = value.split('.')
  return toNumber(wholePart) * 6 + toNumber(ballPart)
}

const calculateRunRate = (runs, balls) => {
  if (!balls) return '0.00'
  return (runs / (balls / 6)).toFixed(2)
}

const getDisplayShort = (name, fallback) => {
  if (!name) return fallback
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const formatDateTime = (timestampMs) => {
  if (!timestampMs) return '--'
  const date = new Date(timestampMs)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const LiveMach = ({ searchQuery = '' }) => {
  const [matchBundle, setMatchBundle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdateLabel, setLastUpdateLabel] = useState('Waiting for first API update')

  useEffect(() => {
    let isMounted = true
    let isRefreshing = false

    const preferredMatchId = toNumber(import.meta.env.VITE_CRICBUZZ_MATCH_ID) || undefined

    const refreshLiveData = async () => {
      if (isRefreshing) return
      isRefreshing = true

      try {
        const payload = await fetchLiveMatchBundle(preferredMatchId)
        if (!isMounted) return

        setMatchBundle(payload)
        setError('')
        setLastUpdateLabel(`Updated at ${new Date().toLocaleTimeString()}`)
      } catch (fetchError) {
        if (!isMounted) return

        const message = fetchError?.message ?? 'Failed to fetch live cricket data'
        setError(message)
      } finally {
        if (isMounted) setIsLoading(false)
        isRefreshing = false
      }
    }

    refreshLiveData()
    const intervalId = setInterval(refreshLiveData, POLL_INTERVAL_MS)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  const meta = matchBundle?.meta ?? {}
  const scorePayload = matchBundle?.scorecard ?? {}
  const inningsList = scorePayload?.scorecard ?? []
  const currentInnings = inningsList.length > 0 ? inningsList[inningsList.length - 1] : null
  const previousInnings = inningsList.length > 1 ? inningsList[inningsList.length - 2] : null

  const teamOneName = meta?.team1?.teamname ?? inningsList[0]?.batteamname ?? 'Team 1'
  const teamOneShort = meta?.team1?.teamsname ?? getDisplayShort(teamOneName, 'T1')
  const teamTwoName = meta?.team2?.teamname ?? inningsList[1]?.batteamname ?? 'Team 2'
  const teamTwoShort = meta?.team2?.teamsname ?? getDisplayShort(teamTwoName, 'T2')

  const inningsByShortName = inningsList.reduce((accumulator, innings) => {
    if (innings?.batteamsname) {
      accumulator[innings.batteamsname] = innings
    }
    return accumulator
  }, {})

  const teamOneInnings =
    inningsByShortName[teamOneShort] ??
    inningsList.find((innings) => innings?.batteamname === teamOneName) ??
    null

  const teamTwoInnings =
    inningsByShortName[teamTwoShort] ??
    inningsList.find((innings) => innings?.batteamname === teamTwoName) ??
    null

  const currentRuns = toNumber(currentInnings?.score)
  const currentWickets = toNumber(currentInnings?.wickets)
  const currentOvers = currentInnings?.overs ?? '-'
  const currentBalls = oversToBalls(currentOvers)
  const currentRR = currentInnings?.runrate
    ? Number(currentInnings.runrate).toFixed(2)
    : calculateRunRate(currentRuns, currentBalls)

  const hasTarget = previousInnings?.score !== undefined && previousInnings?.score !== null
  const target = hasTarget ? toNumber(previousInnings.score) + 1 : null
  const requiredRuns = target !== null ? Math.max(target - currentRuns, 0) : null

  const formatLimit = getFormatOverLimit(meta?.matchformat)
  const ballsLeft = formatLimit ? Math.max(formatLimit * 6 - currentBalls, 0) : null
  const requiredRR =
    requiredRuns !== null && ballsLeft !== null && ballsLeft > 0
      ? ((requiredRuns * 6) / ballsLeft).toFixed(2)
      : '0.00'

  const status = meta?.status ?? scorePayload?.status ?? 'Live status updating'
  const normalizedSearch = String(searchQuery).trim().toLowerCase()
  const isSearchActive = normalizedSearch.length > 0
  const liveSearchMatched = !isSearchActive
    ? true
    : [
        meta?.seriesname,
        meta?.matchdesc,
        meta?.matchformat,
        meta?.state,
        meta?.venueinfo?.ground,
        meta?.venueinfo?.city,
        teamOneName,
        teamOneShort,
        teamTwoName,
        teamTwoShort,
        status,
        matchBundle?.matchId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))

  const teamCards = [
    {
      name: teamOneName,
      short: teamOneShort,
      score:
        teamOneInnings?.score !== undefined
          ? `${toNumber(teamOneInnings.score)}/${toNumber(teamOneInnings.wickets)}`
          : '--/--',
      overs: teamOneInnings?.overs !== undefined ? `${teamOneInnings.overs} ov` : '-- ov',
      runRate:
        teamOneInnings?.runrate !== undefined
          ? `RR ${Number(teamOneInnings.runrate).toFixed(2)}`
          : 'RR --',
    },
    {
      name: teamTwoName,
      short: teamTwoShort,
      score:
        teamTwoInnings?.score !== undefined
          ? `${toNumber(teamTwoInnings.score)}/${toNumber(teamTwoInnings.wickets)}`
          : '--/--',
      overs: teamTwoInnings?.overs !== undefined ? `${teamTwoInnings.overs} ov` : '-- ov',
      runRate:
        teamTwoInnings?.runrate !== undefined
          ? `RR ${Number(teamTwoInnings.runrate).toFixed(2)}`
          : 'RR --',
    },
  ]

  const detailStats = [
    { label: 'Required Runs', value: requiredRuns === null ? '-' : String(requiredRuns) },
    { label: 'Balls Left', value: ballsLeft === null ? '-' : String(ballsLeft) },
    { label: 'Required RR', value: requiredRuns === null ? '-' : requiredRR },
    { label: 'Current RR', value: currentRR },
  ]

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Live Match Details</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {meta?.seriesname ?? 'Live Cricket Match'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {meta?.matchdesc ?? 'Match'} | {meta?.venueinfo?.ground ?? 'Venue update pending'}
              {meta?.venueinfo?.city ? `, ${meta.venueinfo.city}` : ''}
            </p>
            <p className="text-sm text-slate-500 mt-2">{meta?.tossstatus ?? 'Toss update pending'}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 min-w-[230px]">
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Live Status</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{status}</p>
            <p className="text-xs text-slate-600 mt-1">
              Target {target ?? '-'} | {currentRuns}/{currentWickets} ({currentOvers} ov)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Last update: {lastUpdateLabel} | Match ID: {matchBundle?.matchId ?? '-'}
            </p>
          </div>
        </div>

        {isLoading && !matchBundle && (
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Loading live match details...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            API error: {error}
          </div>
        )}

        {isSearchActive && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              liveSearchMatched
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {liveSearchMatched
              ? `Search matched in live section for "${searchQuery.trim()}".`
              : `No direct live match result for "${searchQuery.trim()}". Showing latest live match.`}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teamCards.map((team) => (
            <article key={team.short} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{team.short}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
                </div>
                <span className="inline-flex h-8 min-w-[2.5rem] px-2 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  {team.short}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">{team.score}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{team.overs}</span>
                <span>{team.runRate}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {detailStats.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Match Details</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Format</p>
              <p className="text-slate-800 mt-1">{meta?.matchformat ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">State</p>
              <p className="text-slate-800 mt-1">{meta?.state ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Venue</p>
              <p className="text-slate-800 mt-1">
                {meta?.venueinfo?.ground ?? '-'}
                {meta?.venueinfo?.city ? `, ${meta.venueinfo.city}` : ''}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Live Fetch Time</p>
              <p className="text-slate-800 mt-1">{formatDateTime(Date.now())}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default LiveMach
