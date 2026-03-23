import axios from 'axios'

const API_BASE_URL = 'https://cricbuzz-cricket.p.rapidapi.com'
const API_HOST = 'cricbuzz-cricket.p.rapidapi.com'

const getApiKey = () => import.meta.env.VITE_RAPIDAPI_KEY

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

const cricketApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

const getData = async (url) => {
  const response = await cricketApi.get(url, {
    headers: createApiHeaders(),
    validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
  })

  if (response.status === 204) {
    return null
  }

  return response.data
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

export const fetchLiveMatches = async () => {
  const payload = await getData('/matches/v1/live')
  return flattenMatches(payload)
}

export const fetchRecentMatches = async () => {
  const payload = await getData('/matches/v1/recent')
  return flattenMatches(payload)
}

export const resolveDefaultMatchId = async (preferredMatchId) => {
  if (preferredMatchId) {
    return Number(preferredMatchId)
  }

  const liveMatches = await fetchLiveMatches()
  if (liveMatches.length > 0) {
    return Number(liveMatches[0].matchId)
  }

  const recentMatches = await fetchRecentMatches()
  if (recentMatches.length > 0) {
    return Number(recentMatches[0].matchId)
  }

  throw new Error('No live or recent matches found from Cricbuzz API')
}

export const fetchMatchMeta = async (matchId) => getData(`/mcenter/v1/${matchId}`)

export const fetchMatchScorecard = async (matchId) => getData(`/mcenter/v1/${matchId}/hscard`)

export const fetchLiveMatchBundle = async (preferredMatchId) => {
  const resolvedMatchId = await resolveDefaultMatchId(preferredMatchId)

  const [meta, scorecard] = await Promise.all([
    fetchMatchMeta(resolvedMatchId),
    fetchMatchScorecard(resolvedMatchId),
  ])

  return {
    matchId: resolvedMatchId,
    meta,
    scorecard,
  }
}
