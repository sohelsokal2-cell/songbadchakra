'use client'

import React, { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null
  fallbackSrc?: string
}

const DEFAULT_FALLBACK = '/images/news-placeholder.svg'

export default function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)

  const resolvedSrc = !src || error ? fallbackSrc : src

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt || 'সংবাদচক্র খবর'}
      onError={() => {
        if (!error) setError(true)
      }}
    />
  )
}
