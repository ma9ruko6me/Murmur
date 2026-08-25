const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6']

function colorForUserId(userId: number): string {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length]
}

function initials(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || '?'
}

interface AvatarProps {
  userId: number
  displayName: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-20 w-20 text-3xl',
}

export function Avatar({ userId, displayName, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${SIZE_CLASSES[size]}`}
      style={{ background: colorForUserId(userId) }}
    >
      {initials(displayName)}
    </div>
  )
}
