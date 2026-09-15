import type { ReactNode } from 'react'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MDXImage } from '@/components/mdx-image'
import { PostImage } from '@/components/post-image'
import { MockImage } from '@/tests/mocks/next-image'

// Use the actual posts so a missing thumbnail entry cannot silently regress.
const thumbnails = [...new Set(['en-US', 'zh-CN'].flatMap((locale) => {
  const directory = resolve('content', locale)
  return readdirSync(directory).filter(file => file.endsWith('.mdx')).flatMap((file) => {
    const { data } = matter(readFileSync(resolve(directory, file), 'utf8'))
    return typeof data.thumbnail === 'string' ? [data.thumbnail] : []
  })
}))]

function imageDocument(element: ReactNode) {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html')
}

function expectCloudinaryPicture(document: Document) {
  const sources = [...document.querySelectorAll('picture source')]
  expect(sources.map(source => source.getAttribute('type'))).toEqual([
    'image/jxl',
    'image/avif',
    'image/webp',
  ])
  for (const source of sources) {
    const candidates = (source.getAttribute('srcset') ?? '').split(', ')
    expect(candidates.length).toBeGreaterThan(1)
    expect(source.getAttribute('sizes')).toBeTruthy()
    for (const candidate of candidates) {
      expect(candidate).toContain('https://res.cloudinary.com/paulapplegate-com/image/upload/')
      expect(candidate).toContain(`/f_${source.getAttribute('type')?.split('/')[1]}/`)
      expect(candidate).not.toContain('f_auto')
      expect(candidate).toMatch(/ \d+w$/)
    }
  }
  const fallback = document.querySelector('picture img')
  expect(fallback?.getAttribute('src')).toContain('/f_webp/')
  expect(fallback?.getAttribute('srcset')).toBe(sources[2].getAttribute('srcset'))
}

describe('Cloudinary image delivery', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'paulapplegate-com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(thumbnails)('serves the post thumbnail %s in all three responsive formats', (src) => {
    expectCloudinaryPicture(imageDocument(<PostImage src={src} alt="Post thumbnail" />))
  })

  it('uses the same Cloudinary pipeline for ordinary local Markdown images', () => {
    expectCloudinaryPicture(imageDocument(
      <MDXImage src="/thumbnails/laptop-computer-on-table.jpg" alt="Local image" />,
    ))
  })

  it('honors eager loading when a registered image is requested eagerly', () => {
    const document = imageDocument(<PostImage src={thumbnails[0]} alt="Cover" loading="eager" />)
    expect(document.querySelector('picture img')?.getAttribute('loading')).toBe('eager')
  })

  it('keeps responsive Next.js optimization for local images without a manifest entry', () => {
    imageDocument(<MDXImage src="/unregistered.jpg" alt="New image" />)
    expect(MockImage).toHaveBeenLastCalledWith(expect.objectContaining({
      unoptimized: false,
    }), undefined)
  })

  it('keeps external demo images usable without requiring a Cloudinary upload', () => {
    const src = 'https://octodex.github.com/images/minion.png'
    const document = imageDocument(<MDXImage src={src} alt="Minion" />)
    expect(document.querySelector('picture')).toBeNull()
    expect(document.querySelector('img')?.getAttribute('src')).toBe(src)
    expect(MockImage).toHaveBeenLastCalledWith(expect.objectContaining({ unoptimized: true }), undefined)
  })

  it('preserves the intentional missing-image example as a relative URL', () => {
    const document = imageDocument(<MDXImage src="error.jpg" alt="Error image" />)
    expect(document.querySelector('img')?.getAttribute('src')).toBe('error.jpg')
    expect(MockImage).toHaveBeenLastCalledWith(expect.objectContaining({ unoptimized: true }), undefined)
  })
})
