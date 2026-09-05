interface AdvertisementPlaceholderProps {
  size?: 'banner' | 'rectangle' | 'square'
  label?: string
  className?: string
}

const sizeClasses = {
  banner:    'h-24',
  rectangle: 'h-60',
  square:    'h-64',
}

export default function AdvertisementPlaceholder({
  size = 'rectangle',
  label = 'বিজ্ঞাপন',
  className = '',
}: AdvertisementPlaceholderProps) {
  return (
    <div
      aria-label={`${label} এলাকা`}
      className={`bg-gray-100 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 ${sizeClasses[size]} ${className}`}
    >
      <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
  )
}
