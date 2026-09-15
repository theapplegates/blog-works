import { PostImage } from '@/components/post-image'
import { cn } from '@/lib/utils'

interface MDXImageProps {
  src?: string
  alt?: string
  title?: string
  className?: string
  width?: number
  height?: number
}

export function MDXImage({ src, alt = 'Image', title, className, width, height }: MDXImageProps) {
  return (
    <figure className="prose-img:m-0 text-center">
      <span className="relative block h-128 w-full overflow-hidden">
        <PostImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          placeholder="No Image Available"
          sizes="(min-width: 1280px) 814px, (min-width: 1024px) 558px, (min-width: 768px) 670px, (min-width: 640px) 542px, calc(100vw - 98px)"
          unoptimized={src !== undefined && (!src.startsWith('/') || src.startsWith('//'))}
          className={cn('object-contain', className)}
        />
      </span>
      {title !== undefined && title !== '' && (
        <figcaption data-testid="mdx-image-title" className="line-clamp-3">
          {title}
        </figcaption>
      )}
    </figure>
  )
}
