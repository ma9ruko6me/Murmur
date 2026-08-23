import { useQuery } from '@tanstack/react-query'
import { fetchNewPostCount } from '../api/posts'

const POLL_INTERVAL_MS = 30_000

export function useNewPostsAvailable(latestKnownId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['posts', 'new-count', latestKnownId],
    queryFn: () => fetchNewPostCount(latestKnownId!),
    enabled: enabled && latestKnownId != null,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })
}
