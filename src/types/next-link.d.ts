declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react"
  interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    children?: ReactNode
    replace?: boolean
    prefetch?: boolean
    scroll?: boolean
  }
  const Link: import("react").ForwardRefExoticComponent<
    LinkProps & import("react").RefAttributes<HTMLAnchorElement>
  >
  export default Link
}
