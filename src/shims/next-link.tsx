import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react"

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children?: ReactNode
  replace?: boolean
  prefetch?: boolean
  scroll?: boolean
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      children,
      replace: _replace,
      prefetch: _prefetch,
      scroll: _scroll,
      ...props
    },
    ref
  ) => (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  )
)

Link.displayName = "Link"
export default Link
