interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  circle?: boolean
  count?: number
}

/**
 * Skeleton - Reusable loading skeleton component (PR-20)
 * Shows animated placeholder while content is loading
 */
export function Skeleton({
  width,
  height,
  className = '',
  circle = false,
  count = 1,
}: SkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const baseClasses = `bg-neutral-200 animate-pulse ${circle ? 'rounded-full' : 'rounded'} ${className}`

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={baseClasses} style={skeletonStyle} />
        ))}
      </>
    )
  }

  return <div className={baseClasses} style={skeletonStyle} />
}

/**
 * SkeletonText - Text line skeleton with multiple lines support
 */
export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-neutral-200 animate-pulse rounded"
          style={{
            width: index === lines - 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonCard - Card skeleton for dashboard grid items
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
      {/* Thumbnail */}
      <Skeleton height={180} className="w-full" />
      {/* Title */}
      <Skeleton height={20} width="70%" />
      {/* Subtitle */}
      <Skeleton height={16} width="50%" />
    </div>
  )
}

/**
 * SkeletonList - List item skeleton for layer panel
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton width={16} height={16} />
          <Skeleton height={20} className="flex-1" />
          <Skeleton width={16} height={16} />
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonCanvas - Full canvas loading skeleton
 */
export function SkeletonCanvas() {
  return (
    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <Skeleton width={64} height={64} circle />
        </div>
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

/**
 * LoadingSpinner - Simple spinner for inline loading states
 */
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600"
      style={{ width: size, height: size }}
    />
  )
}


