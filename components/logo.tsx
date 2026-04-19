interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 120, className = "" }: LogoProps) {
  // Complete logo aspect ratio is 2.12:1 (width:height)
  const width = Math.round(size * 2.12)
  
  return (
    <img 
      src="/new@-nuloafrica.svg"
      alt="NuloAfrica" 
      width={width}
      height={size}
      className={className}
      style={{ display: 'block' }}
    />
  )
}