const FLAG_RULES = [
  { code: 'af', names: ['afghanistan'], shorts: ['afg'] },
  { code: 'au', names: ['australia'], shorts: ['aus'] },
  { code: 'bd', names: ['bangladesh'], shorts: ['ban'] },
  { code: 'ca', names: ['canada'], shorts: ['can'] },
  { code: 'gb', names: ['england'], shorts: ['eng'] },
  { code: 'in', names: ['india'], shorts: ['ind'] },
  { code: 'ie', names: ['ireland'], shorts: ['ire'] },
  { code: 'nz', names: ['new zealand'], shorts: ['nz'] },
  { code: 'np', names: ['nepal'], shorts: ['nep'] },
  { code: 'om', names: ['oman'], shorts: ['omn'] },
  { code: 'pk', names: ['pakistan'], shorts: ['pak'] },
  { code: 'lk', names: ['sri lanka'], shorts: ['sl'] },
  { code: 'za', names: ['south africa'], shorts: ['sa'] },
  { code: 'us', names: ['united states', 'usa'], shorts: ['usa'] },
  { code: 'ae', names: ['united arab emirates', 'uae'], shorts: ['uae'] },
  { code: 'zw', names: ['zimbabwe'], shorts: ['zim'] },
  { code: 'nl', names: ['netherlands'], shorts: ['ned'] },
  { code: 'gb', names: ['scotland'], shorts: ['sco'] },
  { code: 'na', names: ['namibia'], shorts: ['nam'] },
  { code: 'bb', names: ['west indies'], shorts: ['wi'] },
]

const normalizeText = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const getTeamCountryCode = (teamOrCountryName) => {
  const normalized = normalizeText(teamOrCountryName)
  if (!normalized) return null

  const tokens = normalized.split(' ')

  const matchedRule = FLAG_RULES.find(
    (rule) =>
      rule.names.some((name) => normalized === name || normalized.includes(name)) ||
      rule.shorts.some((shortName) => tokens.includes(shortName))
  )

  return matchedRule?.code ?? null
}

export const getTeamFlagUrl = (teamOrCountryName, width = 24) => {
  const code = getTeamCountryCode(teamOrCountryName)
  if (!code) return ''

  return `https://flagcdn.com/w${width}/${code}.png`
}

export const getTeamInitials = (teamOrCountryName) => {
  const normalized = normalizeText(teamOrCountryName)
  if (!normalized) return '??'

  const words = normalized.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return `${words[0][0] ?? ''}${words[words.length - 1][0] ?? ''}`.toUpperCase()
}
