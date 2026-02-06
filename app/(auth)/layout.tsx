export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-warm-ivory-gradient">
      {/* No navbar in auth pages - clean, focused experience */}
      {children}
    </div>
  )
}