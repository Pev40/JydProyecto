"use client"

interface ReloadButtonProps {
  className?: string
  children: React.ReactNode
}

export function ReloadButton({ className, children }: ReloadButtonProps) {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <button onClick={handleReload} className={className}>
      {children}
    </button>
  )
}
