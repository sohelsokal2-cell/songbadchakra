/**
 * Image Reviewer Role — ছবি যাচাইকারী
 *
 * Evaluates candidate images for a news article.
 * Checks: URL validity, content-type, relevance, source, license status.
 *
 * IMPORTANT RULES:
 * - Never removes watermarks or attribution
 * - Never crops/alters images to hide ownership
 * - Real photo ≠ copyright-free
 * - AI-generated images are NOT used as substitute for real news photos
 * - Tracks license_status separately
 */

import type {
  CollectorResult,
  WriterResult,
  ImageReviewerResult,
  LicenseStatus,
} from '@/types/ai'
import { validateUrl } from './collector'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MIN_VALID_IMAGE_SIZE_BYTES = 1000 // < 1KB = likely broken/placeholder

interface ImageCandidate {
  url: string
  source: 'rss_feed' | 'article_content'
}

/**
 * Probe an image URL with a HEAD request to verify it exists and is an image.
 * Returns the content-type and content-length if available.
 */
async function probeImageUrl(url: string): Promise<{
  contentType: string | null
  contentLength: number | null
  ok: boolean
}> {
  try {
    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'SongbadChakra-ImageBot/1.0',
      },
    })
    clearTimeout(timerId)

    if (!response.ok) return { contentType: null, contentLength: null, ok: false }

    const contentType = response.headers.get('content-type') ?? null
    const contentLength = response.headers.get('content-length')
      ? parseInt(response.headers.get('content-length')!, 10)
      : null

    return { contentType, contentLength, ok: true }
  } catch {
    return { contentType: null, contentLength: null, ok: false }
  }
}

/**
 * Determine license status from image URL/domain.
 * This is a heuristic only — real licensing requires per-image verification.
 */
function inferLicenseStatus(url: string): LicenseStatus {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    // Known free/open image sources
    const freeHosts = ['images.unsplash.com', 'picsum.photos', 'upload.wikimedia.org', 'commons.wikimedia.org']
    if (freeHosts.some((h) => hostname.includes(h))) return 'allowed'

    // News outlet images — typically restricted/attributed
    const newsHosts = ['ichef.bbci.co.uk', 'prothomalo.com', 'thedailystar.net', 'prothom-alo.com']
    if (newsHosts.some((h) => hostname.includes(h))) return 'restricted'

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function runImageReviewer(
  collected: CollectorResult,
  written: WriterResult,
  minimumScore = 85
): Promise<ImageReviewerResult> {
  const startMs = Date.now()
  const issues: string[] = []

  const candidates: ImageCandidate[] = []
  if (collected.imageUrl && validateUrl(collected.imageUrl)) {
    candidates.push({ url: collected.imageUrl, source: 'rss_feed' })
  }

  if (candidates.length === 0) {
    // No image available — article can proceed without one (if Rule Engine allows)
    return {
      status: 'PASS',
      score: 0,
      decision: 'PASS',
      approvedImageUrl: undefined,
      imageRelevance: 0,
      imageQuality: 0,
      imageSource: undefined,
      licenseStatus: 'not_available',
      attributionRequired: false,
      issues: ['No image available from source.'],
      latencyMs: Date.now() - startMs,
    }
  }

  // Try each candidate in order
  for (const candidate of candidates) {
    const probe = await probeImageUrl(candidate.url)

    if (!probe.ok) {
      issues.push(`Image URL unreachable: ${candidate.url.slice(0, 80)}`)
      continue
    }

    const contentType = probe.contentType?.split(';')[0].trim().toLowerCase() ?? ''
    if (!ALLOWED_IMAGE_TYPES.some((t) => contentType.includes(t.replace('image/', '')))) {
      issues.push(`Non-image content-type (${contentType}): ${candidate.url.slice(0, 80)}`)
      continue
    }

    if (probe.contentLength !== null && probe.contentLength < MIN_VALID_IMAGE_SIZE_BYTES) {
      issues.push(`Image too small (${probe.contentLength} bytes): likely placeholder.`)
      continue
    }

    const licenseStatus = inferLicenseStatus(candidate.url)
    let hostname = ''
    try {
      hostname = new URL(candidate.url).hostname
    } catch {
      hostname = 'unknown'
    }

    // Score heuristics
    let imageRelevance = 70   // moderate relevance (RSS image assumed related)
    let imageQuality = 75     // moderate quality (can't actually inspect pixels)
    const attributionRequired = licenseStatus !== 'allowed'

    if (licenseStatus === 'allowed') {
      imageRelevance = 90
      imageQuality = 85
    }
    if (licenseStatus === 'restricted') {
      issues.push(`Image from ${hostname} may require attribution. Marked as restricted.`)
    }
    if (licenseStatus === 'unknown') {
      issues.push(`Image license unknown for ${hostname}. Proceeding with attribution requirement.`)
    }

    const score = Math.round((imageRelevance + imageQuality) / 2)
    const decision = score >= minimumScore ? 'PASS' : 'FAIL'

    return {
      status: decision,
      score,
      decision,
      approvedImageUrl: candidate.url,
      imageRelevance,
      imageQuality,
      imageSource: hostname,
      licenseStatus,
      attributionRequired,
      issues,
      latencyMs: Date.now() - startMs,
    }
  }

  // No valid image found
  return {
    status: 'PASS',  // Image optional by default — Rule Engine decides
    score: 0,
    decision: 'PASS',
    approvedImageUrl: undefined,
    imageRelevance: 0,
    imageQuality: 0,
    imageSource: undefined,
    licenseStatus: 'not_available',
    attributionRequired: false,
    issues: [...issues, 'All image candidates failed validation.'],
    latencyMs: Date.now() - startMs,
  }
}
