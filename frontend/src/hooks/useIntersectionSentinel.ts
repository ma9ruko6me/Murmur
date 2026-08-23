import { useEffect, useRef } from 'react'

export function useIntersectionSentinel(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onIntersect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return ref
}
