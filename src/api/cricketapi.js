import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_RAPIDAPI_BASE_URL ?? 'https://cricbuzz-cricket2.p.rapidapi.com'
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST ?? 'cricbuzz-cricket2.p.rapidapi.com'
const RANKINGS_BASE_URL =
  import.meta.env.VITE_RAPIDAPI_RANKINGS_BASE_URL ?? 'https://crickbuzz-official-apis.p.rapidapi.com'
const RANKINGS_HOST =
  import.meta.env.VITE_RAPIDAPI_RANKINGS_HOST ?? 'crickbuzz-official-apis.p.rapidapi.com'

const getApiKey = () => import.meta.env.VITE_RAPIDAPI_KEY
const getRankingsApiKey = () => import.meta.env.VITE_RAPIDAPI_KEY_RANKINGS ?? import.meta.env.VITE_RAPIDAPI_KEY

const createApiHeaders = () => {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Missing VITE_RAPIDAPI_KEY in .env')
  }

  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': API_HOST,
    'Content-Type': 'application/json',
  }
}

const createRankingsHeaders = () => {
  const apiKey = getRankingsApiKey()

  if (!apiKey) {
    throw new Error('Missing VITE_RAPIDAPI_KEY or VITE_RAPIDAPI_KEY_RANKINGS in .env')
  }

  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': RANKINGS_HOST,
    'Content-Type': 'application/json',
  }
}

const cricketApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

const rankingsApi = axios.create({
  baseURL: RANKINGS_BASE_URL,
  timeout: 20000,
})

const normalizeApiErrorMessage = (error) => {
  const status = Number(error?.response?.status ?? 0)
  const rawMessage =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    'Failed to fetch cricket API data'

  const message = String(rawMessage).toLowerCase()
  const isQuotaError =
    status === 429 ||
    message.includes('exceeded the daily quota') ||
    message.includes('exceeded the monthly quota') ||
    message.includes('daily quota') ||
    message.includes('monthly quota')

  if (isQuotaError) {
    return 'Data not found'
  }

  return rawMessage
}

const getData = async (url) => {
  try {
    const response = await cricketApi.get(url, {
      headers: createApiHeaders(),
      validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
    })

    if (response.status === 204) return null
    return response.data
  } catch (error) {
    const message = normalizeApiErrorMessage(error)
    throw new Error(message)
  }
}

const getRankingsData = async (url, params = {}) => {
  try {
    const response = await rankingsApi.get(url, {
      params,
      headers: createRankingsHeaders(),
      validateStatus: (status) => status >= 200 && status < 300,
    })

    return response.data
  } catch (error) {
    const message = normalizeApiErrorMessage(error)
    throw new Error(message)
  }
}

const flattenMatches = (payload) => {
  if (!payload?.typeMatches) return []

  return payload.typeMatches.flatMap((typeBlock) =>
    (typeBlock.seriesMatches ?? []).flatMap((seriesBlock) =>
      (seriesBlock?.seriesAdWrapper?.matches ?? [])
        .map((match) => match?.matchInfo)
        .filter(Boolean)
    )
  )
}

const extractMatchRows = (payload) => {
  if (!payload?.typeMatches) return []

  return payload.typeMatches.flatMap((typeBlock) =>
    (typeBlock.seriesMatches ?? []).flatMap((seriesBlock) =>
      (seriesBlock?.seriesAdWrapper?.matches ?? [])
        .map((match) => ({
          matchType: typeBlock?.matchType ?? '',
          seriesName: seriesBlock?.seriesAdWrapper?.seriesName ?? '',
          matchInfo: match?.matchInfo ?? null,
          matchScore: match?.matchScore ?? null,
        }))
        .filter((row) => row.matchInfo)
    )
  )
}

const oversToBalls = (overs) => {
  if (overs === undefined || overs === null) return 0

  const value = String(overs)
  if (!value.includes('.')) {
    const fullOvers = Number(value)
    return Number.isFinite(fullOvers) ? fullOvers * 6 : 0
  }

  const [wholePart, ballPart = '0'] = value.split('.')
  const whole = Number(wholePart)
  const balls = Number(ballPart)

  return (Number.isFinite(whole) ? whole : 0) * 6 + (Number.isFinite(balls) ? balls : 0)
}

const computeRunRate = (runs, overs) => {
  const balls = oversToBalls(overs)
  if (!balls) return 0
  return Number((runs / (balls / 6)).toFixed(2))
}

const mapTeamInnings = (teamScore, teamInfo) => {
  const entries = Object.values(teamScore ?? {})
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => Number(a?.inningsId ?? 0) - Number(b?.inningsId ?? 0))

  return entries.map((inng) => {
    const runs = Number(inng?.runs ?? 0)
    const wickets = Number(inng?.wickets ?? 0)
    const overs = inng?.overs ?? 0

    return {
      inningsid: Number(inng?.inningsId ?? 0),
      batteamname: teamInfo?.teamName ?? 'Team',
      batteamsname: teamInfo?.teamSName ?? 'T',
      score: runs,
      wickets,
      overs,
      runrate: computeRunRate(runs, overs),
      ballnbr: oversToBalls(overs),
      batsman: [],
      bowler: [],
      fow: { fow: [] },
    }
  })
}

const buildBundleFromMatchRow = (row) => {
  const info = row?.matchInfo ?? {}
  const score = row?.matchScore ?? {}
  const team1 = info?.team1 ?? {}
  const team2 = info?.team2 ?? {}

  const innings = [
    ...mapTeamInnings(score?.team1Score, team1),
    ...mapTeamInnings(score?.team2Score, team2),
  ].sort((a, b) => Number(a.inningsid ?? 0) - Number(b.inningsid ?? 0))

  return {
    matchId: Number(info?.matchId ?? 0),
    meta: {
      seriesname: info?.seriesName ?? 'Live Cricket Match',
      matchdesc: info?.matchDesc ?? 'Match',
      venueinfo: {
        ground: info?.venueInfo?.ground ?? 'Venue update pending',
        city: info?.venueInfo?.city ?? '',
      },
      tossstatus: info?.tossStatus ?? info?.tossstatus ?? 'Toss update pending',
      status: info?.status ?? 'Status update pending',
      state: info?.state ?? '',
      matchformat: info?.matchFormat ?? '',
      team1: {
        teamname: team1?.teamName ?? 'Team 1',
        teamsname: team1?.teamSName ?? 'T1',
      },
      team2: {
        teamname: team2?.teamName ?? 'Team 2',
        teamsname: team2?.teamSName ?? 'T2',
      },
    },
    scorecard: {
      status: info?.status ?? 'Status update pending',
      scorecard: innings,
    },
  }
}

const pickBestLiveRow = (rows) => {
  if (!rows || rows.length === 0) return null

  const statePriority = (row) => {
    const stateText = `${row?.matchInfo?.state ?? ''} ${row?.matchInfo?.status ?? ''}`.toLowerCase()

    if (
      stateText.includes('live') ||
      stateText.includes('in progress') ||
      stateText.includes('innings') ||
      stateText.includes('delay')
    ) {
      return 3
    }

    if (stateText.includes('preview')) return 2
    return 1
  }

  return [...rows]
    .sort((a, b) => {
      const stateDiff = statePriority(b) - statePriority(a)
      if (stateDiff !== 0) return stateDiff
      return Number(b?.matchInfo?.startDate ?? 0) - Number(a?.matchInfo?.startDate ?? 0)
    })[0]
}

const formatInningsScore = (teamScore) => {
  if (!teamScore) return 'Yet to bat'

  const innings = Object.values(teamScore)
    .filter((value) => value && typeof value === 'object')
    .sort((a, b) => Number(a.inningsId ?? 0) - Number(b.inningsId ?? 0))

  if (innings.length === 0) return 'Yet to bat'

  return innings
    .map((entry) => {
      const runs = entry?.runs ?? 0
      const wickets = entry?.wickets ?? 0
      const overs = entry?.overs ?? '-'
      return `${runs}/${wickets} (${overs} ov)`
    })
    .join(' & ')
}

const normalizeHistoryMatch = (row) => {
  const info = row.matchInfo
  const score = row.matchScore
  const startDateMs = Number(info?.startDate ?? 0)
  const endDateMs = Number(info?.endDate ?? 0)
  const venueGround = info?.venueInfo?.ground ?? ''
  const venueCity = info?.venueInfo?.city ?? ''
  const venueText = [venueGround, venueCity].filter(Boolean).join(', ')

  return {
    matchId: Number(info?.matchId ?? 0),
    matchType: row.matchType ?? '',
    seriesName: info?.seriesName ?? row.seriesName ?? '',
    matchDesc: info?.matchDesc ?? '',
    matchFormat: info?.matchFormat ?? '',
    status: info?.status ?? 'Status unavailable',
    state: info?.state ?? '',
    stateTitle: info?.stateTitle ?? '',
    startDateMs,
    endDateMs,
    venue: venueText || 'Venue TBD',
    team1: {
      name: info?.team1?.teamName ?? 'Team 1',
      short: info?.team1?.teamSName ?? 'T1',
      score: formatInningsScore(score?.team1Score),
    },
    team2: {
      name: info?.team2?.teamName ?? 'Team 2',
      short: info?.team2?.teamSName ?? 'T2',
      score: formatInningsScore(score?.team2Score),
    },
  }
}

const getWeekBounds = (referenceDate = new Date(), weekOffset = 0) => {
  const start = new Date(referenceDate)
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek)
  start.setDate(start.getDate() + weekOffset * 7)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const fetchLiveMatches = async () => {
  const payload = await getData('/matches/v1/live')
  return flattenMatches(payload)
}

export const fetchRecentMatches = async () => {
  const payload = await getData('/matches/v1/recent')
  return flattenMatches(payload)
}

export const fetchLiveMatchBundle = async (preferredMatchId) => {
  const [livePayload, recentPayload, upcomingPayload] = await Promise.all([
    getData('/matches/v1/live'),
    getData('/matches/v1/recent'),
    getData('/matches/v1/upcoming'),
  ])

  const liveRows = extractMatchRows(livePayload)
  const recentRows = extractMatchRows(recentPayload)
  const upcomingRows = extractMatchRows(upcomingPayload)
  const allRows = [...liveRows, ...recentRows, ...upcomingRows]

  let selected = null

  if (preferredMatchId) {
    selected = allRows.find((row) => Number(row?.matchInfo?.matchId) === Number(preferredMatchId)) ?? null
  }

  if (!selected) {
    selected = pickBestLiveRow(liveRows) ?? pickBestLiveRow(recentRows) ?? pickBestLiveRow(upcomingRows)
  }

  if (!selected) {
    throw new Error('No matches found from Cricbuzz API')
  }

  return buildBundleFromMatchRow(selected)
}

const fetchMatchesByWeekOffset = async (weekOffset = 0) => {
  const [livePayload, recentPayload, upcomingPayload] = await Promise.all([
    getData('/matches/v1/live'),
    getData('/matches/v1/recent'),
    getData('/matches/v1/upcoming'),
  ])

  const mergedRows = [
    ...extractMatchRows(livePayload),
    ...extractMatchRows(recentPayload),
    ...extractMatchRows(upcomingPayload),
  ]

  const byMatchId = new Map()

  mergedRows.forEach((row) => {
    const matchId = Number(row?.matchInfo?.matchId ?? 0)
    if (!matchId) return

    const existing = byMatchId.get(matchId)
    const currentHasScore = Boolean(row?.matchScore)
    const existingHasScore = Boolean(existing?.matchScore)

    if (!existing || (!existingHasScore && currentHasScore)) {
      byMatchId.set(matchId, row)
    }
  })

  const { start, end } = getWeekBounds(new Date(), weekOffset)
  const weekStartMs = start.getTime()
  const weekEndMs = end.getTime()

  const matches = Array.from(byMatchId.values())
    .map(normalizeHistoryMatch)
    .filter((match) => match.startDateMs >= weekStartMs && match.startDateMs <= weekEndMs)
    .sort((a, b) => a.startDateMs - b.startDateMs)

  return {
    weekStartMs,
    weekEndMs,
    matches,
  }
}

export const fetchThisWeekMatches = async () => fetchMatchesByWeekOffset(0)

export const fetchLastWeekMatches = async () => fetchMatchesByWeekOffset(-1)

const pickRankingsArray = (payload) => {
  if (Array.isArray(payload)) return payload

  const directCandidates = [
    payload?.rankings,
    payload?.data,
    payload?.response,
    payload?.teamRankings,
    payload?.ranks,
    payload?.list,
  ]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }

  if (payload && typeof payload === 'object') {
    const firstArray = Object.values(payload).find((value) => Array.isArray(value))
    if (firstArray) return firstArray
  }

  return []
}

const normalizeRankRow = (item, index) => ({
  rank: Number(item?.rank ?? item?.position ?? item?.pos ?? item?.ranking ?? index + 1),
  team:
    item?.teamName ??
    item?.team ??
    item?.name ??
    item?.team_name ??
    item?.country ??
    `Team ${index + 1}`,
  rating: Number(item?.rating ?? item?.points ?? item?.point ?? item?.score ?? 0),
  matches: Number(item?.matches ?? item?.match ?? item?.played ?? item?.playedMatches ?? 0),
})

const requestRankingsFromEndpoints = async (endpoints, params = {}) => {
  let lastError = null

  for (const endpoint of endpoints) {
    try {
      return await getRankingsData(endpoint, params)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('Rankings endpoint unavailable')
}

const normalizePlayerRankRow = (item, index) => ({
  rank: Number(item?.rank ?? item?.position ?? item?.pos ?? item?.ranking ?? index + 1),
  player:
    item?.playerName ??
    item?.name ??
    item?.player ??
    item?.fullName ??
    item?.batsman ??
    item?.bowler ??
    `Player ${index + 1}`,
  country:
    item?.country ??
    item?.teamName ??
    item?.team ??
    item?.nation ??
    item?.team_name ??
    item?.countryName ??
    'Unknown',
  rating: Number(item?.rating ?? item?.points ?? item?.point ?? item?.score ?? 0),
})

const flattenCommentaryPayload = (payload) => {
  if (!payload) return []

  if (Array.isArray(payload)) return payload

  const directCandidates = [
    payload?.commentaryList,
    payload?.commentary,
    payload?.data,
    payload?.response,
    payload?.items,
    payload?.comments,
  ]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate
  }

  if (payload && typeof payload === 'object') {
    const firstArray = Object.values(payload).find((value) => Array.isArray(value))
    if (firstArray) return firstArray
  }

  return []
}

const normalizeCommentaryRow = (item, index) => ({
  id: Number(item?.id ?? item?.commentaryId ?? item?.eventId ?? index + 1),
  over: item?.overNumber ?? item?.over ?? item?.overs ?? '',
  text:
    item?.commText ??
    item?.commentary ??
    item?.text ??
    item?.description ??
    item?.event ??
    'Live update',
  timestampMs:
    Number(item?.timestamp ?? item?.timestampMs ?? item?.ballTime ?? item?.createdTime ?? Date.now()) ||
    Date.now(),
})

export const fetchTeamRankings = async ({ formatType = 't20', women = '1' } = {}) => {
  const payload = await getRankingsData('/rankings/team/', {
    formatType,
    women,
  })

  const rankings = pickRankingsArray(payload)
    .map(normalizeRankRow)
    .sort((a, b) => a.rank - b.rank)

  return rankings
}

export const fetchWomenT20TeamRankings = async () =>
  fetchTeamRankings({
    formatType: 't20',
    women: '1',
  })

export const fetchPlayerRankings = async ({
  formatType = 't20',
  women = '0',
  roleType = 'batsman',
} = {}) => {
  const payload = await requestRankingsFromEndpoints(
    ['/rankings/player/', '/rankings/players/', '/rankings/player'],
    {
      formatType,
      women,
      roleType,
      type: roleType,
      category: roleType,
    }
  )

  return pickRankingsArray(payload)
    .map(normalizePlayerRankRow)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20)
}

export const fetchLiveCommentary = async (matchId) => {
  if (!matchId) return []

  const endpoints = [
    `/mcenter/v1/${matchId}/comm`,
    `/mcenter/v1/${matchId}/commentary`,
    `/matches/v1/${matchId}/commentary`,
  ]

  let payload = null
  let lastError = null

  for (const endpoint of endpoints) {
    try {
      payload = await getData(endpoint)
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!payload) {
    if (lastError) {
      throw new Error(lastError?.message ?? 'Commentary endpoint unavailable')
    }
    return []
  }

  return flattenCommentaryPayload(payload)
    .map(normalizeCommentaryRow)
    .sort((a, b) => Number(b.timestampMs ?? 0) - Number(a.timestampMs ?? 0))
}
