interface LogoProps {
  size?: number
  className?: string
  /**
   * "default" — the standard dark-text logo (for light backgrounds).
   * "light"   — the light logo variant (for dark backgrounds, e.g. the
   *             dark landing page hero/header).
   */
  variant?: "default" | "light"
}

export function Logo({ size = 120, className = "", variant = "default" }: LogoProps) {
  // Complete logo aspect ratio is 2.12:1 (width:height)
  const width = Math.round(size * 2.12)

  const src =
    variant === "light"
      ? "/nuloafrica-newlightlogo-complete.png"
      : "/new@-nuloafrica.svg"

  return (
    <img
      src={src}
      alt="NuloAfrica"
      width={width}
      height={size}
      className={className}
      style={{ display: "block" }}
    />
  )
}
