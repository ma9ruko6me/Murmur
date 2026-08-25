import { useState } from 'react'

interface FollowButtonProps {
  userId: number
  followedByMe: boolean
  onToggle: (userId: number, followedByMe: boolean) => Promise<void>
}

export function FollowButton({ userId, followedByMe, onToggle }: FollowButtonProps) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      await onToggle(userId, followedByMe)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        followedByMe
          ? 'rounded-full border border-border bg-surface px-5 py-2 font-semibold text-text hover:bg-bg disabled:opacity-50'
          : 'rounded-full bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50'
      }
    >
      {followedByMe ? 'フォロー中' : 'フォローする'}
    </button>
  )
}
