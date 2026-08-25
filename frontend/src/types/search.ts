import type { FollowUser } from './follow'

export type UserSearchResult = FollowUser

export interface UserSearchResultPage {
  items: UserSearchResult[]
  nextCursor: string | null
}
