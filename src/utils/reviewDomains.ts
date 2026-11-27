import type { Domain } from '@/types';

export function extractReviewDomains(reviews: readonly { domain?: string | null }[]): Domain[] {
  return [...new Set(
    reviews
      .map((review) => review.domain?.trim())
      .filter((domain): domain is string => Boolean(domain)),
  )];
}