export type User = {
  handle: string
  tier: number
  profileImageUrl: string
}

export type Tier = {
  color: `#${string}`
  name: string
}

export type Problem = {
  problemId: number
  titleKo: string
  acceptedUserCount: number
  level: number
  averageTries: number
}

export type Status = {
  handle: string
  problemId: number
  result: string
  time: number
}
