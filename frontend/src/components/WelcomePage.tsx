import { useEffect, useState } from 'react'
import { logout } from '../api/auth'
import type { AuthUser } from '../types/auth'

interface WelcomePageProps {
  user: AuthUser
  onLogout: () => void
}

const MURMURS = [
  'つぶやきは今日も静かに漂う。',
  '誰かのタイムラインに、小さな灯りがひとつ。',
  '140字じゃ足りない日もあるよね。',
  'いいねの数より、続けることの方が難しい。',
  '今日の一言、まだ思いつかない。',
  'フォローする勇気、フォローされる喜び。',
  'サーバーの向こうで誰かが呟いている。',
]

const CONFETTI_COLORS = ['#33475b', '#f2a65a', '#5b8c5a', '#c1666b', '#7e6b8f']

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
}

function createConfettiPieces(): ConfettiPiece[] {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.8 + Math.random() * 1.2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
}

function ConfettiBurst() {
  const [pieces] = useState<ConfettiPiece[]>(createConfettiPieces)

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="animate-confetti-fall absolute top-[-10px] h-2.5 w-1.5"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

export function WelcomePage({ user, onLogout }: WelcomePageProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [murmur, setMurmur] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  function handleListen() {
    setMurmur(MURMURS[Math.floor(Math.random() * MURMURS.length)])
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout().catch(() => undefined)
    onLogout()
  }

  return (
    <div className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
      {showConfetti && <ConfettiBurst />}

      <h1 className="text-2xl font-bold text-accent">Murmur</h1>
      <p className="text-lg text-text">
        ようこそ、<span className="font-semibold">{user.displayName}</span>さん
      </p>
      <p className="text-sm text-text-muted">ログインに成功しました。</p>

      <div className="flex min-h-16 w-full items-center justify-center rounded-lg border border-dashed border-border bg-bg px-4 py-3">
        {murmur ? (
          <p className="text-sm text-text">{murmur}</p>
        ) : (
          <p className="text-sm text-text-muted">今日のつぶやきはまだありません</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleListen}
        className="w-full rounded bg-accent px-3 py-2 font-semibold text-white hover:bg-accent-hover"
      >
        今日のつぶやきを聞く
      </button>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-sm font-semibold text-text-muted underline disabled:opacity-50"
      >
        ログアウト
      </button>
    </div>
  )
}
