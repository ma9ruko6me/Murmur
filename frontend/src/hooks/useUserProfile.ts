import { useQuery } from '@tanstack/react-query'
import { fetchUserProfile } from '../api/users'

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['users', username],
    queryFn: () => fetchUserProfile(username),
  })
}
