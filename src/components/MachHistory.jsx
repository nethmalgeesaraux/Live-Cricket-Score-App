import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchLastWeekMatches, fetchThisWeekMatches } from '../api/cricketapi'
import { getDemoLastWeekMatchesPayload, getDemoThisWeekMatchesPayload } from '../assets/demoData'
import TeamFlag from './TeamFlag'

const REFRESH_INTERVAL_MS = 30000
const REMINDER_LEAD_TIME_MS = 10 * 60 * 1000

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

const formatDateTime = (timestampMs) => {
  if (!timestampMs) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
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

const filterMatchesByQuery = (matches, query) => {
  if (!query) return matches

  return matches.filter((match) => {
    const searchableText = [
      match?.seriesName,
      match?.matchDesc,
      match?.matchType,
      match?.matchFormat,
      match?.status,
      match?.venue,
      match?.team1?.name,
      match?.team1?.short,
      match?.team2?.name,
      match?.team2?.short,
      match?.matchId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })
}

const detectGenderCategory = (match) => {
  const text = `${match?.seriesName ?? ''} ${match?.team1?.name ?? ''} ${match?.team2?.name ?? ''}`.toLowerCase()
  return text.includes('women') || text.includes("women's") ? 'women' : 'men'
}

const normalizeFormat = (formatText) => {
  const text = String(formatText ?? '').toLowerCase()
  if (text.includes('t20')) return 't20'
  if (text.includes('odi') || text.includes('one day')) return 'odi'
  if (text.includes('test')) return 'test'
  return 'other'
}

const applyAdvancedFilters = (matches, filters) => {
  const { categoryFilter = 'all', formatFilter = 'all', genderFilter = 'all', liveOnly = false, venueQuery = '' } = filters

  let rows = [...matches]

  if (categoryFilter === 'results') {
    rows = rows.filter((match) => buildStateBadge(match.state, match.status).label === 'Complete')
  }

  if (categoryFilter === 'fixtures') {
    rows = rows.filter((match) => buildStateBadge(match.state, match.status).label === 'Upcoming')
  }

  if (formatFilter !== 'all') {
    rows = rows.filter((match) => normalizeFormat(match?.matchFormat) === formatFilter)
  }

  if (genderFilter !== 'all') {
    rows = rows.filter((match) => detectGenderCategory(match) === genderFilter)
  }

  if (liveOnly) {
    rows = rows.filter((match) => buildStateBadge(match.state, match.status).label === 'Live')
  }

  const normalizedVenue = String(venueQuery).trim().toLowerCase()
  if (normalizedVenue) {
    rows = rows.filter((match) => String(match?.venue ?? '').toLowerCase().includes(normalizedVenue))
  }

  return rows
}

const groupMatchesByDate = (matches) => {
  const buckets = new Map()

  matches.forEach((match) => {
    const timestamp = Number(match?.startDateMs ?? 0)
    if (!timestamp) return

    const date = new Date(timestamp)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0'
    )}`

    if (!buckets.has(key)) {
      buckets.set(key, { key, timestamp, matches: [] })
    }

    buckets.get(key).matches.push(match)
  })

  return Array.from(buckets.values())
    .map((group) => ({
      ...group,
      matches: [...group.matches].sort((a, b) => Number(a.startDateMs ?? 0) - Number(b.startDateMs ?? 0)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

const groupMatchesBySeries = (matches) => {
  const groups = new Map()

  matches.forEach((match) => {
    const key = match?.seriesName || 'Unknown Series'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(match)
  })

  return Array.from(groups.entries())
    .map(([seriesName, groupMatches]) => ({
      seriesName,
      matches: [...groupMatches].sort((a, b) => Number(a.startDateMs ?? 0) - Number(b.startDateMs ?? 0)),
    }))
    .sort((a, b) => b.matches.length - a.matches.length)
}

const getTeamOptions = (matches) => {
  const teamSet = new Set()

  matches.forEach((match) => {
    if (match?.team1?.name) teamSet.add(match.team1.name)
    if (match?.team2?.name) teamSet.add(match.team2.name)
  })

  return Array.from(teamSet).sort((a, b) => a.localeCompare(b))
}

const matchHasTeam = (match, teamName) =>
  match?.team1?.name?.toLowerCase() === teamName.toLowerCase() ||
  match?.team2?.name?.toLowerCase() === teamName.toLowerCase()

const getMatchResultForTeam = (match, teamName) => {
  const status = String(match?.status ?? '').toLowerCase()
  const teamLower = String(teamName).toLowerCase()

  if (status.includes('abandon') || status.includes('no result') || status.includes('nr')) return 'NR'
  if (status.includes('draw')) return 'D'
  if (status.includes('tie')) return 'T'

  if (status.includes('won')) {
    return status.includes(teamLower) ? 'W' : 'L'
  }

  return '-'
}

const resultChipClass = (resultCode) => {
  if (resultCode === 'W') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (resultCode === 'L') return 'bg-rose-100 text-rose-700 border border-rose-200'
  if (resultCode === 'D' || resultCode === 'T') return 'bg-slate-100 text-slate-700 border border-slate-200'
  if (resultCode === 'NR') return 'bg-amber-100 text-amber-700 border border-amber-200'
  return 'bg-slate-100 text-slate-500 border border-slate-200'
}

const buildSearchSuggestions = (matches, query) => {
  const keyword = String(query).trim().toLowerCase()
  if (!keyword) return []

  const suggestions = new Set()

  matches.forEach((match) => {
    ;[
      match?.seriesName,
      match?.team1?.name,
      match?.team2?.name,
      match?.team1?.short,
      match?.team2?.short,
      match?.venue,
      match?.matchFormat,
    ]
      .filter(Boolean)
      .forEach((text) => {
        const value = String(text)
        if (value.toLowerCase().includes(keyword)) suggestions.add(value)
      })
  })

  return Array.from(suggestions).slice(0, 6)
}

const getHeadToHeadSummary = (matches, teamA, teamB) => {
  const summary = {
    teamAWins: 0,
    teamBWins: 0,
    drawOrTie: 0,
    noResult: 0,
  }

  matches.forEach((match) => {
    const status = String(match?.status ?? '').toLowerCase()

    if (status.includes('abandon') || status.includes('no result') || status.includes('nr')) {
      summary.noResult += 1
      return
    }

    if (status.includes('draw') || status.includes('tie')) {
      summary.drawOrTie += 1
      return
    }

    if (status.includes('won')) {
      if (status.includes(String(teamA).toLowerCase())) summary.teamAWins += 1
      if (status.includes(String(teamB).toLowerCase())) summary.teamBWins += 1
    }
  })

  return summary
}

const MatchHistoryCard = ({ match, onSetReminder, isReminderSet }) => {
  const badge = buildStateBadge(match.state, match.status)
  const canSetReminder = badge.label === 'Upcoming' && Number(match?.startDateMs ?? 0) > 0

  return (
    <article
      key={match.matchId}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] anim-card-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {match.matchType || 'Cricket'} | {match.matchFormat}
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">{match.seriesName}</h3>
          <p className="text-xs text-slate-500 mt-1">{match.matchDesc}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
          {canSetReminder && (
            <button
              type="button"
              onClick={() => onSetReminder?.(match)}
              disabled={isReminderSet}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                isReminderSet
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {isReminderSet ? 'Reminder Set' : 'Remind me'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <TeamFlag name={match.team1.name} size={14} />
                <span>{match.team1.short}</span>
              </span>
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
              <TeamFlag name={match.team1.name} size={16} />
              <span>{match.team1.name}</span>
            </p>
          </div>
          <p className="text-sm text-slate-700 text-right">{match.team1.score}</p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <TeamFlag name={match.team2.name} size={14} />
                <span>{match.team2.short}</span>
              </span>
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
              <TeamFlag name={match.team2.name} size={16} />
              <span>{match.team2.name}</span>
            </p>
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
  notice,
  isLoading,
  emptyText,
  tone = 'blue',
  viewMode,
  onViewModeChange,
  reminderIds,
  onSetReminder,
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

  const groupedByDate = useMemo(() => groupMatchesByDate(matches), [matches])
  const groupedBySeries = useMemo(() => groupMatchesBySeries(matches), [matches])

  return (
    <div className={`rounded-2xl border ${toneClasses.panelBorder} ${toneClasses.panelBg} p-4 sm:p-5 anim-reveal-up`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${toneClasses.subLabel}`}>{subtitle}</p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">Week range: {weekLabel}</p>
        </div>
        <div className={`rounded-xl border ${toneClasses.summaryBorder} ${toneClasses.summaryBg} px-3 py-2 min-w-[250px]`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${toneClasses.summaryLabel}`}>Summary</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{summaryLabel}</p>
          <div className="mt-2 inline-flex rounded-full border border-white/60 bg-white/70 p-1">
            {['cards', 'calendar', 'series'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 rounded-full text-xs ${
                  viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode === 'cards' ? 'Cards' : mode === 'calendar' ? 'Calendar' : 'Series'}
              </button>
            ))}
          </div>
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

      {notice && (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {notice}
        </div>
      )}

      {!isLoading && !error && matches.length === 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          {emptyText}
        </div>
      )}

      {viewMode === 'cards' && matches.length > 0 && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchHistoryCard
              key={match.matchId}
              match={match}
              onSetReminder={onSetReminder}
              isReminderSet={reminderIds.includes(match.matchId)}
            />
          ))}
        </div>
      )}

      {viewMode === 'calendar' && matches.length > 0 && (
        <div className="mt-5 space-y-3">
          {groupedByDate.map((group) => (
            <div key={group.key} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <h4 className="text-sm font-semibold text-slate-900">{formatDate(group.timestamp)}</h4>
                <p className="text-xs text-slate-500">{group.matches.length} matches</p>
              </div>
              <div className="mt-3 space-y-2">
                {group.matches.map((match) => {
                  const badge = buildStateBadge(match.state, match.status)
                  const canSetReminder = badge.label === 'Upcoming' && Number(match?.startDateMs ?? 0) > 0
                  const isReminderSet = reminderIds.includes(match.matchId)

                  return (
                    <div
                      key={`calendar-${match.matchId}`}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {formatTime(match.startDateMs)} | {match.matchType || 'Cricket'} {match.matchFormat ? `| ${match.matchFormat}` : ''}
                        </p>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          <span className="inline-flex items-center gap-1">
                            <TeamFlag name={match.team1.name} size={14} />
                            <span>{match.team1.short}</span>
                            <span>vs</span>
                            <TeamFlag name={match.team2.name} size={14} />
                            <span>{match.team2.short}</span>
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 truncate">{match.seriesName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                        {canSetReminder && (
                          <button
                            type="button"
                            onClick={() => onSetReminder?.(match)}
                            disabled={isReminderSet}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                              isReminderSet
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {isReminderSet ? 'Reminder Set' : 'Remind me'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'series' && matches.length > 0 && (
        <div className="mt-5 space-y-3">
          {groupedBySeries.map((group) => (
            <details key={`series-${group.seriesName}`} className="rounded-xl border border-slate-200 bg-white p-3" open>
              <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{group.seriesName}</p>
                <span className="text-xs text-slate-500">{group.matches.length} matches</span>
              </summary>
              <div className="mt-3 space-y-2">
                {group.matches.map((match) => {
                  const badge = buildStateBadge(match.state, match.status)
                  return (
                    <div
                      key={`series-row-${match.matchId}`}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {formatDate(match.startDateMs)} | {formatTime(match.startDateMs)}
                        </p>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          <span className="inline-flex items-center gap-1">
                            <TeamFlag name={match.team1.name} size={14} />
                            <span>{match.team1.short}</span>
                            <span>vs</span>
                            <TeamFlag name={match.team2.name} size={14} />
                            <span>{match.team2.short}</span>
                          </span>
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

const TeamFormPanel = ({ teamOptions, selectedTeam, onSelectTeam, matches }) => {
  const completedMatches = useMemo(
    () => matches.filter((match) => buildStateBadge(match.state, match.status).label === 'Complete'),
    [matches]
  )

  const teamLastFive = useMemo(() => {
    if (!selectedTeam) return []

    return completedMatches
      .filter((match) => matchHasTeam(match, selectedTeam))
      .sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0))
      .slice(0, 5)
  }, [completedMatches, selectedTeam])

  const formSummary = useMemo(() => {
    const summary = { W: 0, L: 0, D: 0, T: 0, NR: 0, '-': 0 }

    teamLastFive.forEach((match) => {
      const code = getMatchResultForTeam(match, selectedTeam)
      summary[code] = (summary[code] ?? 0) + 1
    })

    return summary
  }, [teamLastFive, selectedTeam])

  return (
    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Team Insights</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">Team Form (Last 5 Completed)</h3>
          <p className="text-sm text-slate-600 mt-1">Based on current filters</p>
        </div>
        <div className="min-w-[220px]">
          <label className="text-xs text-slate-500 uppercase tracking-wide">Select Team</label>
          <select
            value={selectedTeam}
            onChange={(event) => onSelectTeam(event.target.value)}
            className="mt-1 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            {teamOptions.length === 0 && <option value="">No teams found</option>}
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {['W', 'L', 'D', 'T', 'NR'].map((code) => (
          <span
            key={`summary-${code}`}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${resultChipClass(
              code
            )}`}
          >
            {code}: {formSummary[code] ?? 0}
          </span>
        ))}
      </div>

      {teamLastFive.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
          No completed matches available for this team in current filter range.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamLastFive.map((match) => {
            const resultCode = getMatchResultForTeam(match, selectedTeam)
            const opponentName =
              match.team1.name.toLowerCase() === selectedTeam.toLowerCase()
                ? match.team2.name
                : match.team1.name

            return (
              <div key={`form-${match.matchId}`} className="rounded-xl border border-white/70 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    <span className="inline-flex items-center gap-1">
                      <span>vs</span>
                      <TeamFlag name={opponentName} size={14} />
                      <span>{opponentName}</span>
                    </span>
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${resultChipClass(resultCode)}`}>
                    {resultCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{match.seriesName}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(match.startDateMs)} | {match.status}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const HeadToHeadPanel = ({ teams, teamA, teamB, onChangeTeamA, onChangeTeamB, matches }) => {
  const summary = useMemo(() => getHeadToHeadSummary(matches, teamA, teamB), [matches, teamA, teamB])
  const recentMeetings = useMemo(
    () => [...matches].sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0)).slice(0, 6),
    [matches]
  )

  return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Head-to-Head</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">Team vs Team Summary</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={teamA}
            onChange={(event) => onChangeTeamA(event.target.value)}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm min-w-[170px]"
          >
            {teams.map((team) => (
              <option key={`h2h-a-${team}`} value={team}>
                {team}
              </option>
            ))}
          </select>
          <select
            value={teamB}
            onChange={(event) => onChangeTeamB(event.target.value)}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm min-w-[170px]"
          >
            {teams
              .filter((team) => team !== teamA)
              .map((team) => (
                <option key={`h2h-b-${team}`} value={team}>
                  {team}
                </option>
              ))}
          </select>
        </div>
      </div>

      {teamA && teamB && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-700">
              <span className="inline-flex items-center gap-1">
                <TeamFlag name={teamA} size={14} />
                <span>
                  {teamA}: {summary.teamAWins} wins
                </span>
              </span>
            </span>
            <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs text-cyan-700">
              <span className="inline-flex items-center gap-1">
                <TeamFlag name={teamB} size={14} />
                <span>
                  {teamB}: {summary.teamBWins} wins
                </span>
              </span>
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
              Draw/Tie: {summary.drawOrTie}
            </span>
            <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-amber-700">
              NR: {summary.noResult}
            </span>
          </div>

          {recentMeetings.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
              No meetings found between selected teams for current filters.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentMeetings.map((match) => (
                <div key={`h2h-${match.matchId}`} className="rounded-xl border border-white/70 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1">
                      <TeamFlag name={match.team1.name} size={14} />
                      <span>{match.team1.short}</span>
                      <span>vs</span>
                      <TeamFlag name={match.team2.name} size={14} />
                      <span>{match.team2.short}</span>
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{match.seriesName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(match.startDateMs)} | {match.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const MachHistory = ({ searchQuery = '' }) => {
  const [thisWeekMatches, setThisWeekMatches] = useState([])
  const [thisWeekStartMs, setThisWeekStartMs] = useState(null)
  const [thisWeekEndMs, setThisWeekEndMs] = useState(null)
  const [lastWeekMatches, setLastWeekMatches] = useState([])
  const [lastWeekStartMs, setLastWeekStartMs] = useState(null)
  const [lastWeekEndMs, setLastWeekEndMs] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [thisWeekError, setThisWeekError] = useState('')
  const [lastWeekError, setLastWeekError] = useState('')
  const [thisWeekNotice, setThisWeekNotice] = useState('')
  const [lastWeekNotice, setLastWeekNotice] = useState('')
  const [lastUpdated, setLastUpdated] = useState('Waiting for first update')
  const [viewMode, setViewMode] = useState('cards')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [liveOnly, setLiveOnly] = useState(false)
  const [venueFilter, setVenueFilter] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [headToHeadTeamA, setHeadToHeadTeamA] = useState('')
  const [headToHeadTeamB, setHeadToHeadTeamB] = useState('')
  const [scheduledReminderIds, setScheduledReminderIds] = useState([])
  const [reminderStatus, setReminderStatus] = useState('')

  const reminderTimeoutsRef = useRef(new Map())
  const normalizedSearch = String(searchQuery).trim().toLowerCase()
  const isSearchActive = normalizedSearch.length > 0

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
        const thisWeekDemo = getDemoThisWeekMatchesPayload()
        const lastWeekDemo = getDemoLastWeekMatchesPayload()
        const thisWeekLiveMatches = thisWeekResult.status === 'fulfilled' ? thisWeekResult.value?.matches ?? [] : []
        const lastWeekLiveMatches = lastWeekResult.status === 'fulfilled' ? lastWeekResult.value?.matches ?? [] : []

        if (thisWeekResult.status === 'fulfilled' && thisWeekLiveMatches.length > 0) {
          setThisWeekMatches(thisWeekLiveMatches)
          setThisWeekStartMs(thisWeekResult.value?.weekStartMs ?? null)
          setThisWeekEndMs(thisWeekResult.value?.weekEndMs ?? null)
          setThisWeekError('')
          setThisWeekNotice('')
          hasSuccessfulResponse = true
        } else {
          setThisWeekMatches(thisWeekDemo.matches)
          setThisWeekStartMs(thisWeekDemo.weekStartMs)
          setThisWeekEndMs(thisWeekDemo.weekEndMs)
          setThisWeekError('')

          const fallbackReason =
            thisWeekResult.status === 'rejected'
              ? resolveFetchError(thisWeekResult.reason, 'Unable to load this week match history')
              : 'Live API returned no this-week matches'
          setThisWeekNotice(`${fallbackReason}. Showing demo data.`)
          hasSuccessfulResponse = true
        }

        if (lastWeekResult.status === 'fulfilled' && lastWeekLiveMatches.length > 0) {
          setLastWeekMatches(lastWeekLiveMatches)
          setLastWeekStartMs(lastWeekResult.value?.weekStartMs ?? null)
          setLastWeekEndMs(lastWeekResult.value?.weekEndMs ?? null)
          setLastWeekError('')
          setLastWeekNotice('')
          hasSuccessfulResponse = true
        } else {
          setLastWeekMatches(lastWeekDemo.matches)
          setLastWeekStartMs(lastWeekDemo.weekStartMs)
          setLastWeekEndMs(lastWeekDemo.weekEndMs)
          setLastWeekError('')

          const fallbackReason =
            lastWeekResult.status === 'rejected'
              ? resolveFetchError(lastWeekResult.reason, 'Unable to load last week match history')
              : 'Live API returned no last-week matches'
          setLastWeekNotice(`${fallbackReason}. Showing demo data.`)
          hasSuccessfulResponse = true
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

  useEffect(() => {
    const reminderTimeouts = reminderTimeoutsRef.current

    return () => {
      reminderTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      reminderTimeouts.clear()
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
  const allMatches = useMemo(
    () =>
      [...thisWeekMatches, ...lastWeekMatches].sort((a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0)),
    [thisWeekMatches, lastWeekMatches]
  )
  const filteredThisWeekBySearch = useMemo(
    () => filterMatchesByQuery(thisWeekMatches, normalizedSearch),
    [thisWeekMatches, normalizedSearch]
  )
  const filteredLastWeekBySearch = useMemo(
    () => filterMatchesByQuery(lastWeekMatches, normalizedSearch),
    [lastWeekMatches, normalizedSearch]
  )

  const filterConfig = useMemo(
    () => ({
      categoryFilter,
      formatFilter,
      genderFilter,
      liveOnly,
      venueQuery: venueFilter,
    }),
    [categoryFilter, formatFilter, genderFilter, liveOnly, venueFilter]
  )

  const filteredThisWeekMatches = useMemo(
    () => applyAdvancedFilters(filteredThisWeekBySearch, filterConfig),
    [filteredThisWeekBySearch, filterConfig]
  )
  const filteredLastWeekMatches = useMemo(
    () => applyAdvancedFilters(filteredLastWeekBySearch, filterConfig),
    [filteredLastWeekBySearch, filterConfig]
  )

  const combinedFilteredMatches = useMemo(
    () =>
      [...filteredThisWeekMatches, ...filteredLastWeekMatches].sort(
        (a, b) => Number(b.startDateMs ?? 0) - Number(a.startDateMs ?? 0)
      ),
    [filteredThisWeekMatches, filteredLastWeekMatches]
  )

  const teamOptions = useMemo(() => getTeamOptions(combinedFilteredMatches), [combinedFilteredMatches])

  useEffect(() => {
    if (teamOptions.length === 0) {
      setSelectedTeam('')
      return
    }
    if (!teamOptions.includes(selectedTeam)) {
      setSelectedTeam(teamOptions[0])
    }
  }, [teamOptions, selectedTeam])

  useEffect(() => {
    if (teamOptions.length === 0) {
      setHeadToHeadTeamA('')
      setHeadToHeadTeamB('')
      return
    }

    if (!teamOptions.includes(headToHeadTeamA)) {
      setHeadToHeadTeamA(teamOptions[0])
      setHeadToHeadTeamB(teamOptions[1] ?? '')
      return
    }

    if (!headToHeadTeamB || !teamOptions.includes(headToHeadTeamB) || headToHeadTeamB === headToHeadTeamA) {
      const fallbackTeamB = teamOptions.find((team) => team !== headToHeadTeamA) ?? ''
      setHeadToHeadTeamB(fallbackTeamB)
    }
  }, [teamOptions, headToHeadTeamA, headToHeadTeamB])

  const headToHeadMatches = useMemo(() => {
    if (!headToHeadTeamA || !headToHeadTeamB || headToHeadTeamA === headToHeadTeamB) return []

    return combinedFilteredMatches.filter(
      (match) => matchHasTeam(match, headToHeadTeamA) && matchHasTeam(match, headToHeadTeamB)
    )
  }, [combinedFilteredMatches, headToHeadTeamA, headToHeadTeamB])

  const totalFilteredCount = filteredThisWeekMatches.length + filteredLastWeekMatches.length
  const searchSuggestions = useMemo(
    () => buildSearchSuggestions(allMatches, normalizedSearch),
    [allMatches, normalizedSearch]
  )
  const thisWeekSummary = isSearchActive
    ? `${filteredThisWeekMatches.length}/${thisWeekMatches.length} matches match current filters`
    : `${filteredThisWeekMatches.length} matches in current filter`
  const lastWeekSummary = isSearchActive
    ? `${filteredLastWeekMatches.length}/${lastWeekMatches.length} matches match current filters`
    : `${filteredLastWeekMatches.length} matches in current filter`
  const thisWeekEmptyText = isSearchActive
    ? `No matches found for "${searchQuery.trim()}" in this week.`
    : 'No matches found for this filter in this week.'
  const lastWeekEmptyText = isSearchActive
    ? `No matches found for "${searchQuery.trim()}" in last week.`
    : 'No matches found for this filter in last week.'

  const resetAdvancedFilters = () => {
    setCategoryFilter('all')
    setFormatFilter('all')
    setGenderFilter('all')
    setLiveOnly(false)
    setVenueFilter('')
  }

  const onSetReminder = async (match) => {
    const matchId = Number(match?.matchId ?? 0)
    if (!matchId) return

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setReminderStatus('This browser does not support notifications.')
      return
    }

    if (reminderTimeoutsRef.current.has(matchId)) {
      setReminderStatus('Reminder already set for this match.')
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') {
      setReminderStatus('Notification permission was not granted.')
      return
    }

    const matchStartMs = Number(match?.startDateMs ?? 0)
    if (!matchStartMs) {
      setReminderStatus('Unable to schedule reminder: match start time unavailable.')
      return
    }

    const reminderAtMs = matchStartMs - REMINDER_LEAD_TIME_MS
    const delayMs = Math.max(reminderAtMs - Date.now(), 0)
    const reminderLabel =
      delayMs > 0 ? formatDateTime(reminderAtMs) : 'now (match starts in less than 10 minutes)'

    const timeoutId = window.setTimeout(() => {
      const title = `${match.team1.short} vs ${match.team2.short} starts soon`
      const body = `${match.seriesName} | Starts at ${formatDateTime(matchStartMs)}`

      new Notification(title, { body })

      reminderTimeoutsRef.current.delete(matchId)
      setScheduledReminderIds((prev) => prev.filter((id) => id !== matchId))
    }, delayMs)

    reminderTimeoutsRef.current.set(matchId, timeoutId)
    setScheduledReminderIds((prev) => (prev.includes(matchId) ? prev : [...prev, matchId]))
    setReminderStatus(`Reminder set for ${match.team1.short} vs ${match.team2.short} at ${reminderLabel}.`)
  }

  return (
    <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12 anim-section-enter">
      <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_35px_rgba(15,23,42,0.09)] anim-card-lift">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Match History</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              This Week + Last Week Fixtures & Results
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Calendar view, completed results tab, advanced filters, series grouping & reminders
            </p>
            {isSearchActive && (
              <p className="text-xs text-blue-700 mt-2">Search filter: "{searchQuery.trim()}"</p>
            )}
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 text-xs rounded-full ${
                categoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('fixtures')}
              className={`px-3 py-1 text-xs rounded-full ${
                categoryFilter === 'fixtures' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fixtures
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('results')}
              className={`px-3 py-1 text-xs rounded-full ${
                categoryFilter === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Results
            </button>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {['all', 't20', 'odi', 'test'].map((format) => (
              <button
                key={`fmt-${format}`}
                type="button"
                onClick={() => setFormatFilter(format)}
                className={`px-3 py-1 text-xs rounded-full ${
                  formatFilter === format ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {format === 'all' ? 'All Formats' : format.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {['all', 'men', 'women'].map((gender) => (
              <button
                key={`gender-${gender}`}
                type="button"
                onClick={() => setGenderFilter(gender)}
                className={`px-3 py-1 text-xs rounded-full ${
                  genderFilter === gender ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {gender === 'all' ? 'All Genders' : gender[0].toUpperCase() + gender.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLiveOnly((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-xs ${
              liveOnly
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {liveOnly ? 'Live Only: ON' : 'Live Only'}
          </button>

          <input
            type="text"
            value={venueFilter}
            onChange={(event) => setVenueFilter(event.target.value)}
            placeholder="Filter by venue"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs min-w-[180px]"
          />

          <button
            type="button"
            onClick={resetAdvancedFilters}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            Reset Filters
          </button>
        </div>

        {reminderStatus && (
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {reminderStatus}
          </div>
        )}

        {isSearchActive && (
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {totalFilteredCount} matches found across this week and last week for current filters.
          </div>
        )}

        {isSearchActive && totalFilteredCount === 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No exact matches found. Try broader keywords: team, series, format, venue.
          </div>
        )}

        {isSearchActive && searchSuggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {searchSuggestions.map((item) => (
              <span
                key={`hint-${item}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
              >
                Try: {item}
              </span>
            ))}
          </div>
        )}

        <HeadToHeadPanel
          teams={teamOptions}
          teamA={headToHeadTeamA}
          teamB={headToHeadTeamB}
          onChangeTeamA={setHeadToHeadTeamA}
          onChangeTeamB={setHeadToHeadTeamB}
          matches={headToHeadMatches}
        />

        <TeamFormPanel
          teamOptions={teamOptions}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          matches={combinedFilteredMatches}
        />

        <div className="mt-5 space-y-5">
          <MatchHistoryWeekPanel
            title="This Week Fixtures & Results"
            subtitle="Current Week"
            weekLabel={thisWeekLabel}
            summaryLabel={thisWeekSummary}
            matches={filteredThisWeekMatches}
            error={thisWeekError}
            notice={thisWeekNotice}
            isLoading={isLoading}
            emptyText={thisWeekEmptyText}
            tone="blue"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            reminderIds={scheduledReminderIds}
            onSetReminder={onSetReminder}
          />

          <MatchHistoryWeekPanel
            title="Last Week Fixtures & Results"
            subtitle="Previous Week"
            weekLabel={lastWeekLabel}
            summaryLabel={lastWeekSummary}
            matches={filteredLastWeekMatches}
            error={lastWeekError}
            notice={lastWeekNotice}
            isLoading={isLoading}
            emptyText={lastWeekEmptyText}
            tone="amber"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            reminderIds={scheduledReminderIds}
            onSetReminder={onSetReminder}
          />
        </div>
      </div>
    </section>
  )
}

export default MachHistory
