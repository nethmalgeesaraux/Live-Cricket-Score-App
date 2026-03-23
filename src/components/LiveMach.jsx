import React, { useEffect, useState } from 'react'
import { fetchLiveMatchBundle } from '../api/cricketapi'

const POLL_INTERVAL_MS = 15000
const DEFAULT_RECENT_BALLS = ['-', '-', '-', '-', '-', '-']

const ballStyleMap = {
  Dot: 'bg-slate-100 text-slate-700 border border-slate-200',
  Wicket: 'bg-rose-100 text-rose-700 border border-rose-200',
  Four: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Six: 'bg-amber-100 text-amber-700 border border-amber-200',
  Info: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

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

  if (typeof overs === 'number') {
    const whole = Math.floor(overs)
    const fraction = Math.round((overs - whole) * 10)
    return whole * 6 + fraction
  }

  const [wholePart, ballPart = '0'] = String(overs).split('.')
  return toNumber(wholePart) * 6 + toNumber(ballPart)
}

const formatBallsAsOver = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`

const calculateRunRate = (runs, balls) => {
  if (!balls) return '0.00'
  return (runs / (balls / 6)).toFixed(2)
}

const normalizeBallToken = (token) => {
  const value = String(token ?? '').trim().toUpperCase()

  if (!value) return null
  if (value === 'W' || value.includes('WICKET')) return 'W'
  if (value === '4' || value.includes('FOUR')) return '4'
  if (value === '6' || value.includes('SIX')) return '6'

  if (/^[0-3]$/.test(value)) return value
  return null
}

const extractBoundaryTokens = (boundaryValue) => {
  if (boundaryValue === null || boundaryValue === undefined) return []

  if (typeof boundaryValue === 'string' || typeof boundaryValue === 'number') {
    const direct = normalizeBallToken(boundaryValue)
    return direct ? [direct] : []
  }

  if (typeof boundaryValue === 'object') {
    return Object.values(boundaryValue)
      .map(normalizeBallToken)
      .filter(Boolean)
  }

  return []
}

const buildRecentBalls = (meta, innings) => {
  const boundaryValues = meta?.boundarytrackervalues?.boundarytrackervalue ?? []
  const fromBoundaries = boundaryValues.flatMap(extractBoundaryTokens)

  if (fromBoundaries.length > 0) {
    const latest = fromBoundaries.slice(-6)
    return [...Array(6 - latest.length).fill('-'), ...latest]
  }

  const wicketCount = clamp(toNumber(innings?.wickets), 0, 6)
  if (wicketCount > 0) {
    return [...Array(6 - wicketCount).fill('-'), ...Array(wicketCount).fill('W')]
  }

  return DEFAULT_RECENT_BALLS
}

const extractBowlerFromDismissal = (outDescription) => {
  if (!outDescription) return 'Unknown bowler'
  const match = String(outDescription).match(/\bb\s+([A-Za-z .'-]+)$/i)
  if (match?.[1]) return match[1].trim()
  return 'Unknown bowler'
}

const buildTimeline = (innings) => {
  const wickets = innings?.fow?.fow ?? []
  const batterList = innings?.batsman ?? []

  if (wickets.length === 0) {
    return [
      {
        over: '--',
        bowler: 'No wicket data',
        batter: 'No dismissal updates yet',
        outcome: 'Info',
      },
    ]
  }

  const dismissalByBatter = new Map(
    batterList.map((batter) => [batter.name, batter.outdec ?? ''])
  )

  return wickets
    .slice(-6)
    .reverse()
    .map((wicket) => {
      const batterName = wicket?.batsmanname ?? 'Unknown batter'
      const dismissal = dismissalByBatter.get(batterName)

      return {
        over:
          typeof wicket?.overnbr === 'number' ? wicket.overnbr.toFixed(1) : String(wicket?.overnbr ?? '--'),
        bowler: extractBowlerFromDismissal(dismissal),
        batter: batterName,
        outcome: 'Wicket',
      }
    })
}

const buildStatusText = ({ requiredRuns, ballsLeft, wickets, fallbackStatus, currentBattingTeam }) => {
  if (requiredRuns === null || ballsLeft === null) {
    return fallbackStatus
  }

  if (requiredRuns === 0) {
    return `${currentBattingTeam} won by ${Math.max(10 - wickets, 0)} wickets`
  }

  if (ballsLeft === 0 || wickets >= 10) {
    return fallbackStatus
  }

  return `${currentBattingTeam} need ${requiredRuns} runs in ${ballsLeft} balls`
}

const pickWinnerFromStatus = (status, teamOneName, teamOneShort, teamTwoName, teamTwoShort) => {
  const normalized = String(status ?? '').toLowerCase()

  const teamOneMatch =
    normalized.includes(String(teamOneName ?? '').toLowerCase()) ||
    normalized.includes(String(teamOneShort ?? '').toLowerCase())

  const teamTwoMatch =
    normalized.includes(String(teamTwoName ?? '').toLowerCase()) ||
    normalized.includes(String(teamTwoShort ?? '').toLowerCase())

  if (teamOneMatch && !teamTwoMatch) return 'teamOne'
  if (teamTwoMatch && !teamOneMatch) return 'teamTwo'
  return null
}

const buildWinChance = ({
  matchState,
  status,
  requiredRuns,
  ballsLeft,
  wickets,
  battingTeamName,
  teamOneName,
  teamOneShort,
  teamTwoName,
  teamTwoShort,
}) => {
  if (String(matchState).toLowerCase() === 'complete') {
    const winner = pickWinnerFromStatus(status, teamOneName, teamOneShort, teamTwoName, teamTwoShort)
    if (winner === 'teamOne') return { teamOne: 100, teamTwo: 0 }
    if (winner === 'teamTwo') return { teamOne: 0, teamTwo: 100 }
  }

  if (requiredRuns === null || ballsLeft === null) {
    return { teamOne: 50, teamTwo: 50 }
  }

  if (requiredRuns === 0) {
    const chasingIsTeamOne = battingTeamName === teamOneName
    return chasingIsTeamOne ? { teamOne: 100, teamTwo: 0 } : { teamOne: 0, teamTwo: 100 }
  }

  if (ballsLeft === 0 || wickets >= 10) {
    const chasingIsTeamOne = battingTeamName === teamOneName
    return chasingIsTeamOne ? { teamOne: 0, teamTwo: 100 } : { teamOne: 100, teamTwo: 0 }
  }

  const pressure = requiredRuns / Math.max(ballsLeft, 1)
  const battingChance = clamp(Math.round(82 - pressure * 18 - wickets * 2 + ballsLeft / 20), 8, 92)
  const chasingIsTeamOne = battingTeamName === teamOneName

  if (chasingIsTeamOne) {
    return { teamOne: battingChance, teamTwo: 100 - battingChance }
  }

  return { teamOne: 100 - battingChance, teamTwo: battingChance }
}

const getDisplayShort = (name, fallback) => {
  if (!name) return fallback
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const LiveMach = () => {
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

        const message =
          fetchError?.response?.data?.message ??
          fetchError?.message ??
          'Failed to fetch live cricket data'

        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
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
  const currentBallsBowled = toNumber(currentInnings?.ballnbr) || oversToBalls(currentInnings?.overs)
  const currentOvers = currentInnings?.overs ?? formatBallsAsOver(currentBallsBowled)
  const currentRR = currentInnings?.runrate
    ? Number(currentInnings.runrate).toFixed(2)
    : calculateRunRate(currentRuns, currentBallsBowled)

  const hasTarget = previousInnings?.score !== undefined && previousInnings?.score !== null
  const target = hasTarget ? toNumber(previousInnings.score) + 1 : null
  const requiredRuns = target !== null ? Math.max(target - currentRuns, 0) : null

  const formatLimit = getFormatOverLimit(meta?.matchformat)
  const ballsLeft = formatLimit ? Math.max(formatLimit * 6 - currentBallsBowled, 0) : null
  const requiredRR =
    requiredRuns !== null && ballsLeft !== null && ballsLeft > 0
      ? ((requiredRuns * 6) / ballsLeft).toFixed(2)
      : '0.00'

  const defaultStatus = meta?.status ?? scorePayload?.status ?? 'Live match data loaded'
  const status = buildStatusText({
    requiredRuns,
    ballsLeft,
    wickets: currentWickets,
    fallbackStatus: defaultStatus,
    currentBattingTeam: currentInnings?.batteamname ?? teamOneName,
  })

  const winChance = buildWinChance({
    matchState: meta?.state,
    status: defaultStatus,
    requiredRuns,
    ballsLeft,
    wickets: currentWickets,
    battingTeamName: currentInnings?.batteamname,
    teamOneName,
    teamOneShort,
    teamTwoName,
    teamTwoShort,
  })

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

  const chaseStats = [
    { label: 'Required Runs', value: requiredRuns === null ? '-' : String(requiredRuns) },
    { label: 'Balls Left', value: ballsLeft === null ? '-' : String(ballsLeft) },
    { label: 'Required RR', value: requiredRuns === null ? '-' : requiredRR },
    { label: 'Current RR', value: currentRR },
  ]

  const battingLeaders = (currentInnings?.batsman ?? [])
    .filter((batter) => toNumber(batter?.balls) > 0)
    .sort((a, b) => toNumber(b.runs) - toNumber(a.runs))
    .slice(0, 2)
    .map((batter) => ({
      name: batter.name,
      score: `${toNumber(batter.runs)} (${toNumber(batter.balls)})`,
    }))

  const bowlingLeaders = (currentInnings?.bowler ?? [])
    .sort((a, b) => {
      const wicketDelta = toNumber(b.wickets) - toNumber(a.wickets)
      if (wicketDelta !== 0) return wicketDelta
      return toNumber(a.runs) - toNumber(b.runs)
    })
    .slice(0, 2)
    .map((bowler) => ({
      name: bowler.name,
      figures: `${toNumber(bowler.wickets)}/${toNumber(bowler.runs)} (${bowler.overs})`,
    }))

  const keyPlayers = {
    batting:
      battingLeaders.length > 0
        ? battingLeaders
        : [{ name: 'No batting data', score: 'Yet to update' }],
    bowling:
      bowlingLeaders.length > 0
        ? bowlingLeaders
        : [{ name: 'No bowling data', figures: 'Yet to update' }],
  }

  const recentBalls = buildRecentBalls(meta, currentInnings)
  const timeline = buildTimeline(currentInnings)

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                Live Match Center
              </p>
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
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Live Chase</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{status}</p>
            <p className="text-xs text-slate-600 mt-1">
              Target {target ?? '-'} | {currentRuns}/{currentWickets} ({currentOvers} ov)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Batting: {currentInnings?.batteamname ?? '-'} | Bowling:{' '}
              {currentInnings?.batteamname === teamOneName ? teamTwoName : teamOneName}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Last update: {lastUpdateLabel} | Match ID: {matchBundle?.matchId ?? '-'}
            </p>
          </div>
        </div>

        {isLoading && !matchBundle && (
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Loading live cricket data...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            API error: {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
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

          <article className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4">
            <p className="text-xs uppercase tracking-wide text-cyan-200">Win Chance</p>
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>{teamOneShort}</span>
                  <span>{winChance.teamOne}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 mt-1 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${winChance.teamOne}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>{teamTwoShort}</span>
                  <span>{winChance.teamTwo}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 mt-1 overflow-hidden">
                  <div className="h-full bg-blue-300" style={{ width: `${winChance.teamTwo}%` }} />
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {chaseStats.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Recent Balls</h3>
              <p className="text-xs text-slate-500">{currentOvers} over stage</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recentBalls.map((ball, idx) => (
                <span
                  key={`${ball}-${idx}`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                    ball === 'W'
                      ? 'bg-rose-100 text-rose-700'
                      : ball === '4'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ball === '6'
                          ? 'bg-amber-100 text-amber-700'
                          : ball === '0'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">Key Players</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Batting</p>
                {keyPlayers.batting.map((player) => (
                  <p key={player.name} className="text-slate-700 mt-2">
                    {player.name} <span className="text-slate-500">{player.score}</span>
                  </p>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Bowling</p>
                {keyPlayers.bowling.map((player) => (
                  <p key={player.name} className="text-slate-700 mt-2">
                    {player.name} <span className="text-slate-500">{player.figures}</span>
                  </p>
                ))}
              </div>
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Ball-by-Ball Detail</h3>
            <p className="text-xs text-slate-500">Auto refresh every 15s</p>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {timeline.map((event, index) => (
              <div
                key={`${event.over}-${event.bowler}-${event.batter}-${index}`}
                className="rounded-xl border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{event.over}</p>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      ballStyleMap[event.outcome] ?? 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {event.outcome}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-2">
                  {event.bowler} to {event.batter}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default LiveMach
