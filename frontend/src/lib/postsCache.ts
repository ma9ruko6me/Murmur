import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { Post, PostPage } from '../types/post'

export type PostsQueryData = InfiniteData<PostPage, string | null>

export function patchPostInInfiniteCache(
  queryClient: QueryClient,
  postId: number,
  updater: (post: Post) => Post,
): void {
  queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
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

export function prependPostToInfiniteCache(queryClient: QueryClient, created: Post): void {
  queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
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

export function removePostFromInfiniteCache(queryClient: QueryClient, postId: number): void {
  queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
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
