"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"

/**
 * ParticleNetwork
 * ------------------------------------------------------------------
 * Interactive particle constellation. Particles drift continuously in a
 * connected network. On mouse interaction they repel outward in a
 * circular magnetic-field pattern, then smoothly return to drifting.
 *
 * Rendered on a <canvas> for performance.
 * Respects prefers-reduced-motion (renders a static frame, no animation).
 */

interface ParticleNetworkProps {
  className?: string
  color?: string
  density?: number
  linkDistance?: number
}

interface P {
  x: number
  y: number
  vx: number
  vy: number
  bx: number
  by: number
  r: number
}

export function ParticleNetwork({
  className = "",
  color,
  density = 3.5,
  linkDistance = 150,
}: ParticleNetworkProps) {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const particleColor: string =
    color || (theme === "light" ? "#ea580c" : "#f97316")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let particles: P[] = []
    let raf = 0

    const mouse = { x: -9999, y: -9999, active: false }

    // const REPEL_RADIUS = 90
    // const REPEL_STRENGTH = 1.4
    // const BASE_SPEED = 0.9
    // const MAX_SPEED = 3.0
    // const DRIFT_RETURN = 0.025


    const REPEL_RADIUS = 90
    const REPEL_STRENGTH = 2.5
    const BASE_SPEED = 0.9
    const MAX_SPEED = 4.9
    const DRIFT_RETURN = 0.06

    const rand = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const build = () => {
      const parent = canvas.parentElement
      width = parent?.clientWidth ?? window.innerWidth
      height = parent?.clientHeight ?? window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(
        320,
        Math.max(40, Math.round((width * height) / 10000) * density)
      )

      particles = Array.from({ length: count }, () => {
        const angle = rand(0, Math.PI * 2)
        const speed = rand(BASE_SPEED * 0.6, BASE_SPEED)
        return {
          x: rand(0, width),
          y: rand(0, height),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          bx: Math.cos(angle) * speed,
          by: Math.sin(angle) * speed,
          r: rand(1, 2.6),
        }
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.vx += (p.bx - p.vx) * DRIFT_RETURN
        p.vy += (p.by - p.vy) * DRIFT_RETURN

        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.hypot(dx, dy)

          if (dist < REPEL_RADIUS && dist > 0) {
            const t = dist / REPEL_RADIUS
            const force = (1 - t * t) * REPEL_STRENGTH
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        const speed = Math.hypot(p.vx, p.vy)
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED
          p.vy = (p.vy / speed) * MAX_SPEED
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) { p.x = 0; p.vx *= -1; p.bx *= -1 }
        if (p.x > width) { p.x = width; p.vx *= -1; p.bx *= -1 }
        if (p.y < 0) { p.y = 0; p.vy *= -1; p.by *= -1 }
        if (p.y > height) { p.y = height; p.vy *= -1; p.by *= -1 }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < linkDistance) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = particleColor
            ctx.globalAlpha = (1 - dist / linkDistance) * 0.18
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = particleColor
        ctx.globalAlpha = 0.75
        ctx.fill()
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }

    const onLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }

    build()
    if (reduceMotion) {
      draw()
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(draw)
    }

    window.addEventListener("resize", () => build())
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseleave", onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", () => build())
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
    }
  }, [particleColor, density, linkDistance, theme])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  )
}