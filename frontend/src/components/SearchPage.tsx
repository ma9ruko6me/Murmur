import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { AuthUser } from '../types/auth'
import { UserSearchResultList } from './UserSearchResultList'
import { PostSearchResultList } from './PostSearchResultList'

interface SearchPageProps {
  currentUser: AuthUser
}

type SearchTab = 'users' | 'posts'

export function SearchPage({ currentUser }: SearchPageProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('users')

  const debouncedQuery = useDebouncedValue(query, 300)

  return (
    <div className="min-h-svh bg-bg text-text">
      <nav className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-lg text-text-muted hover:text-text"
          aria-label="戻る"
        >
          ←
        </button>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="キーワードで検索"
          className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </nav>

      <main className="mx-auto max-w-[640px] px-4 py-6 pb-16">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={
              activeTab === 'users'
                ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white'
                : 'rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold text-text-muted hover:text-text'
            }
          >
            ユーザー
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={
              activeTab === 'posts'
                ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white'
                : 'rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold text-text-muted hover:text-text'
            }
          >
            投稿
          </button>
        </div>

        {activeTab === 'users' ? (
          <UserSearchResultList currentUser={currentUser} query={debouncedQuery} />
        ) : (
          <PostSearchResultList currentUser={currentUser} query={debouncedQuery} />
        )}
      </main>
    </div>
  )
}
