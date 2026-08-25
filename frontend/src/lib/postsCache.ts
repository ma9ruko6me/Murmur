import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { Post, PostPage } from '../types/post'

export type PostsQueryData = InfiniteData<PostPage, string | null>

export function postsQueryKey(userId?: number, scope?: 'all' | 'following'): readonly unknown[] {
  if (userId != null) {
    return ['posts', 'user', userId]
  }
  return scope != null ? ['posts', 'scope', scope] : ['posts']
}

export function patchPostInInfiniteCache(
  queryClient: QueryClient,
  postId: number,
  updater: (post: Post) => Post,
  queryKey: readonly unknown[] = ['posts'],
): void {
  queryClient.setQueryData<PostsQueryData>(queryKey, (old) => {
    if (!old) {
      return old
    }
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
      })),
    }
  })
}

export function patchPostsByAuthorInInfiniteCache(
  queryClient: QueryClient,
  authorId: number,
  updater: (post: Post) => Post,
  queryKey: readonly unknown[] = ['posts'],
): void {
  queryClient.setQueryData<PostsQueryData>(queryKey, (old) => {
    if (!old) {
      return old
    }
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.userId === authorId ? updater(item) : item)),
      })),
    }
  })
}

export function prependPostToInfiniteCache(
  queryClient: QueryClient,
  created: Post,
  queryKey: readonly unknown[] = ['posts'],
): void {
  queryClient.setQueryData<PostsQueryData>(queryKey, (old) => {
    if (!old) {
      return old
    }
    const [firstPage, ...rest] = old.pages
    const updatedFirstPage: PostPage = {
      ...firstPage,
      items: [created, ...firstPage.items],
    }
    return { ...old, pages: [updatedFirstPage, ...rest] }
  })
}

export function removePostFromInfiniteCache(
  queryClient: QueryClient,
  postId: number,
  queryKey: readonly unknown[] = ['posts'],
): void {
  queryClient.setQueryData<PostsQueryData>(queryKey, (old) => {
    if (!old) {
      return old
    }
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== postId),
      })),
    }
  })
}
