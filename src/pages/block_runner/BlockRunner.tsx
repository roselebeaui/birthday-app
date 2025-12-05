import styles from './BlockRunner.module.css'
import { useEffect, useRef, useState } from 'react'
import { useLobby, type Player } from '../multiplayer/useLobby'
import type { Feature } from './features/types'
import { hole, block, doubleBlock, stairs, laser, turret, swingBall, gravityWell, movingBlock, springPad, windZone, reverseGravity } from './features/library'

export default function BlockRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [distance, setDistance] = useState(0)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const isDeadRef = useRef(false)
  const deathTimerRef = useRef(0)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number | null = null
    const W = canvas.width = 1200
    const H = canvas.height = 600

    // player position in world coords
    let playerWorldX = 50
    // Floor setup
    const groundHeight = 60
    const groundTop = H - groundHeight
    let playerY = groundTop
    const ceilingHeight = 40
    const ceilingBottom = ceilingHeight
    let vx = 0
    let vy = 0
    // difficulty scalars
    const gravity = 0.6 * (difficulty === 'hard' ? 1.05 : difficulty === 'easy' ? 0.9 : 1)
    const accel = 0.8 * (difficulty === 'hard' ? 1.1 : 1)
    const friction = 0.85
    const maxSpeed = (difficulty === 'hard' ? 9 : difficulty === 'easy' ? 7.5 : 8)

    // camera follows player
    let cameraX = 0
    const followOffset = W * 0.35

    // Procedural course generation using features library (extends as you progress)
    let features: Feature[] = []
    let lastFeatureX = 300
    // Ensure the first gravity well appears between 750m and 1200m (world X 7500-12000)
    let firstWellPlaced = false
    // Optional lava segments: intervals where ground is deadly
    const lavaSegments: Array<{ start: number; end: number }> = []
    function generateChunk(count = 18) {
      for (let i = 0; i < count; i++) {
        // Force-place the first gravity well within 750m-1200m if not yet placed
        if (!firstWellPlaced && lastFeatureX >= 7500 && lastFeatureX <= 12000) {
          features.push(gravityWell(lastFeatureX + 40, 500, 0.45))
          lastFeatureX += 300 + Math.random() * 220
          firstWellPlaced = true
          continue
        }
        const choice = Math.random()
        if (choice < 0.15) {
          const safe = Math.random() < 0.5
          const w = 32 + Math.floor(Math.random() * 24)
          const h = 24 + Math.floor(Math.random() * 24)
          features.push(block(lastFeatureX, w, h, safe, Math.random() < 0.25))
          lastFeatureX += 180 + Math.random() * 100
        } else if (choice < 0.25) {
          const size = 24 + Math.floor(Math.random() * 24)
          const gap = 30 + Math.floor(Math.random() * 40)
          const [b1, b2] = doubleBlock(lastFeatureX, gap, size)
          ;(b1 as any).safe = Math.random() < 0.5
          ;(b2 as any).safe = Math.random() < 0.5
          features.push(b1, b2)
          lastFeatureX += gap + 200 + Math.random() * 120
        } else if (choice < 0.4) {
          const steps = 3 + Math.floor(Math.random() * 4)
          const size = 22 + Math.floor(Math.random() * 20)
          const rise = 12 + Math.floor(Math.random() * 16)
          features.push(...stairs(lastFeatureX, steps, size, rise))
          lastFeatureX += 240 + Math.random() * 160
        } else if (choice < 0.55) {
          const width = 80 + Math.floor(Math.random() * 100)
          features.push(hole(lastFeatureX, width))
          lastFeatureX += width + 200 + Math.random() * 120
        } else if (choice < (difficulty === 'easy' ? 0.65 : difficulty === 'hard' ? 0.75 : 0.7)) {
          features.push(laser(lastFeatureX, 24 + Math.floor(Math.random() * 24)))
          lastFeatureX += 200 + Math.random() * 140
        } else if (choice < (difficulty === 'easy' ? 0.78 : difficulty === 'hard' ? 0.86 : 0.82)) {
          features.push(turret(lastFeatureX, 20, 20, 1.2 + Math.random(), Math.PI / 5, 280))
          lastFeatureX += 220 + Math.random() * 160
        } else if (choice < (difficulty === 'easy' ? 0.86 : difficulty === 'hard' ? 0.9 : 0.88)) {
          // moving platform
          const dir: 'horizontal' | 'vertical' = Math.random() < 0.6 ? 'horizontal' : 'vertical'
          features.push(movingBlock(lastFeatureX, 40, 14, dir, 160 + Math.random() * 120, 2 + Math.random() * 1.5, true))
          lastFeatureX += 200 + Math.random() * 140
        } else if (choice < (difficulty === 'easy' ? 0.9 : difficulty === 'hard' ? 0.94 : 0.92)) {
          // spring pad
          features.push(springPad(lastFeatureX, 28, 10, 16 + Math.random() * 6))
          lastFeatureX += 180 + Math.random() * 120
        } else if (choice < (difficulty === 'easy' ? 0.95 : difficulty === 'hard' ? 0.97 : 0.96)) {
          // gravity well zone with reduced gravity (500m width)
          features.push(gravityWell(lastFeatureX + 40, 500, 0.45))
          lastFeatureX += 260 + Math.random() * 180
        } else if (choice < (difficulty === 'easy' ? 0.98 : difficulty === 'hard' ? 0.99 : 0.985)) {
          // wind zone in meters
          features.push(windZone(lastFeatureX, 250, 0.45))
          lastFeatureX += 220 + Math.random() * 160
        } else if (choice < (difficulty === 'easy' ? 0.995 : difficulty === 'hard' ? 0.997 : 0.995)) {
          // reverse gravity stretch
          features.push(reverseGravity(lastFeatureX + 40, 180))
          lastFeatureX += 240 + Math.random() * 180
        } else if (choice < 0.99) {
          // inject a short lava segment with suspended safe blocks
          const segLen = 300 + Math.floor(Math.random() * 300)
          lavaSegments.push({ start: lastFeatureX, end: lastFeatureX + segLen })
          // place a few safe platforms over the lava
          let px = lastFeatureX + 60
          while (px < lastFeatureX + segLen - 60) {
            const w = 40 + Math.floor(Math.random() * 40)
            const h = 40 + Math.floor(Math.random() * 30)
            const spike = Math.random() < 0.3
            features.push(block(px, w, h, true, spike))
            px += w + 60 + Math.random() * 80
          }
          lastFeatureX += segLen + 200
        } else {
          features.push(swingBall(lastFeatureX, 120 + Math.floor(Math.random() * 80), 10 + Math.floor(Math.random() * 8), 0.8 + Math.random() * 0.6))
          lastFeatureX += 220 + Math.random() * 160
        }
      }
    }
    // initial chunk (scaled by difficulty)
    generateChunk(difficulty === 'easy' ? 24 : difficulty === 'hard' ? 44 : 36)

    // laser activation state: add reaction delay and pulse windows
    const laserState = new Map<number, { underTime: number; activeTime: number; isActive: boolean }>()
    for (const f of features) {
      if (f.kind === 'laser') laserState.set(f.x, { underTime: 0, activeTime: 0, isActive: false })
    }

    // turret state and bullets
    const turretState = new Map<number, { cooldown: number; facingRight: boolean }>()
    type Bullet = { x: number; y: number; vx: number; vy: number; life: number }
    const bullets: Bullet[] = []
    for (const f of features) {
      if (f.kind === 'turret') turretState.set(f.x, { cooldown: 0, facingRight: true })
    }

    type Obstacle = { x: number; w: number; h: number; safe?: boolean; spikes?: boolean }
    let obstacles: Obstacle[] = features
      .filter(f => f.kind === 'block' || f.kind === 'moving-block' || f.kind === 'falling-platform' || f.kind === 'spring-pad' || f.kind === 'bridge' || f.kind === 'ghost-block')
      .map(f => ({ x: f.x, w: f.width ?? 32, h: f.height ?? 32, safe: f.safe ?? (f.kind !== 'block' ? true : false), spikes: (f as any).spikes }))

    let canJump = false
    const jump = () => {
      if (isDeadRef.current) return
      if (canJump) vy = -11
    }

    const held = { left: false, right: false }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump()
      if (isDeadRef.current) return
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') held.left = true
      if (e.code === 'ArrowRight' || e.code === 'KeyD') held.right = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') held.left = false
      if (e.code === 'ArrowRight' || e.code === 'KeyD') held.right = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const triggerDeath = () => {
      if (isDeadRef.current) return
      isDeadRef.current = true
      deathTimerRef.current = 0
      particlesRef.current = []
      // explode player into particles
      const cols = 6
      const rows = 6
      const size = 4
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const px = playerWorldX + i * size
          const py = playerY - 20 + j * size
          const angle = Math.random() * Math.PI * 2
          const speed = 120 + Math.random() * 240
          particlesRef.current.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 60,
            life: 1.0 + Math.random() * 0.6,
            size,
          })
        }
      }
    }

    const loop = () => {
      ctx.clearRect(0, 0, W, H)
      // update camera based on player
      if (!isDeadRef.current) {
        cameraX = Math.max(0, playerWorldX - followOffset)
      }

      // extend course when approaching the end
      if (playerWorldX > lastFeatureX - 800) {
        const prevLast = lastFeatureX
        generateChunk(12)
        // register new lasers
        for (const f of features) {
          if (f.kind === 'laser' && !laserState.has(f.x)) {
            laserState.set(f.x, { underTime: 0, activeTime: 0, isActive: false })
          }
        }
        // register new turrets
        for (const f of features) {
          if (f.kind === 'turret' && !turretState.has(f.x)) {
            turretState.set(f.x, { cooldown: 0, facingRight: true })
          }
        }
        // append new obstacles from newly generated features only
        obstacles.push(
          ...features
            .filter(f => f.kind === 'block' && (f.x >= prevLast))
            .map(f => ({ x: f.x, w: f.width ?? 32, h: f.height ?? 32, safe: f.safe, spikes: (f as any).spikes }))
        )
      }

      // ground with holes
      // ground with holes and lava segments
      ctx.fillStyle = '#222'
      // draw ground segments by cutting out holes
      const holes = features.filter(f => f.kind === 'hole')
      const groundStart = -cameraX
      const groundEnd = groundStart + 100000
      let segmentStart = groundStart
      for (const h of holes) {
        const hx = h.x - cameraX
        const hw = h.width ?? 80
        // draw segment before hole
        if (hx > segmentStart) {
          ctx.fillRect(segmentStart, groundTop, hx - segmentStart, groundHeight)
        }
        // visualize hole using canvas background color (#111827)
        ctx.fillStyle = '#111827'
        ctx.fillRect(hx, groundTop, hw, groundHeight)
        ctx.fillStyle = '#222'
        segmentStart = hx + hw
      }
      // draw remaining ground after last hole
      if (segmentStart < groundEnd) {
        ctx.fillRect(segmentStart, groundTop, groundEnd - segmentStart, groundHeight)
      }
      // lava overlays
      for (const seg of lavaSegments) {
        const sx = seg.start - cameraX
        const ex = seg.end - cameraX
        ctx.fillStyle = '#b91c1c'
        ctx.fillRect(sx, groundTop, ex - sx, groundHeight)
      }
      // ceiling
      ctx.fillStyle = '#222'
      ctx.fillRect(-cameraX, 0, 100000, ceilingHeight)
            // render ceiling turrets, detection cones, and fire bullets downward
            const turrets = features.filter(f => f.kind === 'turret')
            for (const t of turrets) {
              const tx = t.x - cameraX
              const tw = t.width ?? 20
              const baseY = 0 // ceiling-mounted
              // draw turret base on ceiling
              ctx.fillStyle = '#374151'
              ctx.fillRect(tx, baseY, tw, ceilingHeight)
              // cone detection: vertical downward cone
              const st = turretState.get(t.x)!
              const px = playerWorldX
              const py = playerY - 10
              const turretCenterX = t.x + tw / 2
              const turretCenterY = ceilingBottom
              const dx = px - turretCenterX
              const dy = py - turretCenterY
              const half = t.coneAngle ?? Math.PI / 6
              const coneLen = groundTop - turretCenterY
              const inCone = dy > 0 && dy <= coneLen && Math.abs(dx) <= Math.tan(half) * dy
              // draw vertical cone outline (make border fully transparent)
              const spread = Math.tan(half) * coneLen
              ctx.beginPath()
              ctx.moveTo(turretCenterX - cameraX, turretCenterY)
              ctx.lineTo(turretCenterX - cameraX + spread, turretCenterY + coneLen)
              ctx.lineTo(turretCenterX - cameraX - spread, turretCenterY + coneLen)
              ctx.closePath()
              ctx.strokeStyle = 'rgba(252,211,77,0)'
              ctx.lineWidth = 0
              // no stroke call to keep it invisible
              // fire logic
              // difficulty scaling for turret rate and bullet speed
              const meters = playerWorldX / 10
              const difficultyMeters = Math.max(0, Math.floor(meters / 500))
              const rate = (t.fireRate ?? 1.5) * (1 + 0.25 * difficultyMeters) * (difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 0.9 : 1)
              st.cooldown = Math.max(0, st.cooldown - 1 / 60)
              if (inCone && st.cooldown <= 0) {
                // aim bullet at player's current position while in cone
                const txp = px - turretCenterX
                const typ = py - turretCenterY
                const len = Math.sqrt(txp * txp + typ * typ) || 1
                const speedMul = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 0.9 : 1
                const speed = 7 + 1.5 * difficultyMeters * speedMul
                const vx = (txp / len) * speed
                const vy = (typ / len) * speed
                bullets.push({ x: turretCenterX, y: turretCenterY, vx, vy, life: 2.5 })
                st.cooldown = 1 / rate
              }
            }

            // update and render bullets
            ctx.fillStyle = '#f87171'
            for (let i = bullets.length - 1; i >= 0; i--) {
              const b = bullets[i]
              b.life -= 1 / 60
              b.x += b.vx
              b.y += b.vy
              // draw
              ctx.beginPath()
              ctx.arc(b.x - cameraX, b.y, 3, 0, Math.PI * 2)
              ctx.fill()
              // hit player?
              const hit = playerWorldX < b.x + 3 && playerWorldX + 20 > b.x - 3 && playerY - 20 < b.y + 3 && playerY > b.y - 3
              if (hit && !isDeadRef.current) {
                triggerDeath()
              }
              // lifetime expired or off-screen
              if (b.life <= 0 || b.y > H + 50 || b.y < -50) bullets.splice(i, 1)
            }
      // draw laser emitters and active beams
      const lasers = features.filter(f => f.kind === 'laser')
      const winds = features.filter(f => f.kind === 'wind-zone')
      const shooters = features.filter(f => f.kind === 'shooter')
      const saws = features.filter(f => f.kind === 'sawblade')
      const boulders = features.filter(f => f.kind === 'boulder')
      const ghosts = features.filter(f => f.kind === 'ghost-block')
      const springs = features.filter(f => f.kind === 'spring-pad')
      const movers = features.filter(f => f.kind === 'moving-block')
      const fallers = features.filter(f => f.kind === 'falling-platform')
      const bridges = features.filter(f => f.kind === 'bridge')
      const rgravs = features.filter(f => f.kind === 'reverse-gravity')
            // bridge: draw segments and progressively break by timer
            for (const br of bridges) {
              const segs = br.segments ?? 6
              const sw = br.segmentWidth ?? 36
              const interval = br.breakInterval ?? 0.6
              const elapsed = (performance.now() / 1000) % (segs * interval)
              const broken = Math.floor(elapsed / interval)
              for (let i = 0; i < segs; i++) {
                if (i < broken) continue
                const bx = br.x + i * sw
                ctx.fillStyle = '#22c55e'
                ctx.fillRect(bx - cameraX, groundTop - 10, sw - 2, 10)
                // include as obstacle when visible
                obstacles.push({ x: bx, w: sw - 2, h: 10, safe: true })
              }
            }

            // reverse gravity zone: tint and flip gravity while inside
            const inReverse = rgravs.find(z => {
              const zw = z.zoneWidth ?? 1800
              return playerWorldX + 20 > z.x && playerWorldX < z.x + zw
            })
            if (inReverse) {
              // tint
              ctx.fillStyle = 'rgba(59,130,246,0.12)'
              ctx.fillRect(inReverse.x - cameraX, 0, (inReverse.zoneWidth ?? 1800), H)
            }
      const wells = features.filter(f => f.kind === 'gravity-well')
            // wind zones: render subtle arrows and apply lateral push in air
            for (const w of winds) {
              const ww = w.windWidth ?? 2000
              const sx = w.x - cameraX
              // arrows
              ctx.strokeStyle = 'rgba(147,197,253,0.35)'
              for (let i = 0; i < Math.max(6, Math.floor(ww / 120)); i++) {
                const x = sx + i * (ww / Math.max(6, Math.floor(ww / 120)))
                const y = ceilingBottom + 60 + (i % 3) * 24
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x + 20, y)
                ctx.lineTo(x + 14, y - 6)
                ctx.stroke()
              }
            }

            // shooters: simple periodic bullets downward
            for (const s of shooters) {
              const rate = s.projectileRate ?? 0.8
              // reuse turret bullets array
              if (Math.random() < rate / 60) {
                bullets.push({ x: s.x, y: groundTop - (s.height ?? 18), vx: 0, vy: 4, life: 3 })
              }
              // draw shooter
              ctx.fillStyle = '#7c3aed'
              ctx.fillRect(s.x - cameraX, groundTop - (s.height ?? 18), s.width ?? 18, s.height ?? 18)
            }

            // sawblades: move along path and collide
            const time = performance.now() / 1000
            for (const s of saws) {
              const L = s.pathLength ?? 220
              const speed = s.speed ?? 2.2
              const dir = s.dir ?? 'horizontal'
              const r = (s as any).swingRadius ?? 12
              const phase = Math.sin(time * speed)
              const cx = s.x + (dir === 'horizontal' ? ((phase + 1) * 0.5) * L : 0)
              const cy = dir === 'vertical' ? groundTop - 40 - ((phase + 1) * 0.5) * L : groundTop - 40
              ctx.fillStyle = '#9ca3af'
              ctx.beginPath()
              ctx.arc(cx - cameraX, cy, r, 0, Math.PI * 2)
              ctx.fill()
              // collision
              const dx = (playerWorldX + 10) - cx
              const dy = (playerY - 10) - cy
              if (dx * dx + dy * dy <= (r + 10) * (r + 10) && !isDeadRef.current) triggerDeath()
            }

            // boulders: roll from left/right and collide
            for (const b of boulders) {
              const r = b.boulderRadius ?? 18
              const dir = b.direction ?? 'right'
              const speed = (b as any).speed ?? 3
              const cx = dir === 'right' ? b.x + ((time * speed) % 600) : b.x - ((time * speed) % 600)
              const cy = groundTop - r
              ctx.fillStyle = '#6b7280'
              ctx.beginPath()
              ctx.arc(cx - cameraX, cy, r, 0, Math.PI * 2)
              ctx.fill()
              const dx = (playerWorldX + 10) - cx
              const dy = (playerY - 10) - cy
              if (dx * dx + dy * dy <= (r + 10) * (r + 10) && !isDeadRef.current) triggerDeath()
            }

            // ghost blocks: toggle visibility/collision by period
            const visibleGhostXs = new Set<number>()
            for (const g of ghosts) {
              const period = g.period ?? 2
              const on = Math.floor(time / (period / 2)) % 2 === 0
              if (on) {
                ctx.fillStyle = 'rgba(34,197,94,0.85)'
                ctx.fillRect(g.x - cameraX, groundTop - (g.height ?? 32), g.width ?? 32, g.height ?? 32)
                visibleGhostXs.add(g.x)
              } else {
                // faint outline
                ctx.strokeStyle = 'rgba(34,197,94,0.25)'
                ctx.strokeRect(g.x - cameraX, groundTop - (g.height ?? 32), g.width ?? 32, g.height ?? 32)
              }
            }
          const meters = playerWorldX / 10
          const difficultyMeters = Math.max(0, Math.floor(meters / 500))
          const laserChargeDelay = Math.max(0.15, (0.45 - 0.08 * difficultyMeters) * (difficulty === 'hard' ? 0.85 : 1))
          const laserPulseDuration = Math.min(1.2, (0.6 + 0.1 * difficultyMeters) * (difficulty === 'hard' ? 1.1 : 1))
      for (const l of lasers) {
        const lx = l.x - cameraX
        const lw = l.activeWidth ?? 24
        // emitter housing on ceiling: visual heating
        const st = laserState.get(l.x)!
        const heatRatio = Math.min(1, st.isActive ? 1 : st.underTime / laserChargeDelay)
        // interpolate from ceiling color (#222) to red (#dc2626)
        const r = Math.floor(34 + (220 - 34) * heatRatio)
        const g = Math.floor(34 + (38 - 34) * heatRatio)
        const b = Math.floor(34 + (38 - 34) * heatRatio)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(lx, 0, lw, ceilingHeight)
        // add glow strip at emitter bottom during heating
        if (!st.isActive && st.underTime > 0) {
          ctx.fillStyle = `rgba(220,38,38,${Math.min(0.6, heatRatio * 0.8)})`
          ctx.fillRect(lx, ceilingBottom - 2, lw, 2)
        }
        // activation logic with delay and pulsing
        const playerUnder = playerWorldX + 20 > l.x && playerWorldX < l.x + lw
        const dt = 1 / 60
        if (playerUnder && !st.isActive) {
          st.underTime += dt
          // require the player to be under for reaction delay
          if (st.underTime >= laserChargeDelay) {
            st.isActive = true
            st.activeTime = 0
          }
        } else if (!playerUnder && !st.isActive) {
          // reset buildup if you leave early
          st.underTime = Math.max(0, st.underTime - dt * 2)
        }

        // when active, beam for a short pulse, then cooldown
        if (st.isActive) {
          st.activeTime += dt
          // draw beam while active
          ctx.fillStyle = 'rgba(220,38,38,0.85)'
          ctx.fillRect(lx + lw / 2 - 2, ceilingBottom, 4, groundTop - ceilingBottom)
          // collision with active beam
          const beamX = l.x + lw / 2 - 2
          const beamW = 4
          const intersectsX = playerWorldX < beamX + beamW && playerWorldX + 20 > beamX
          const intersectsY = playerY > ceilingBottom && playerY <= groundTop
          if (intersectsX && intersectsY && !isDeadRef.current) {
            triggerDeath()
          }
          // beam duration then cooldown
          if (st.activeTime >= laserPulseDuration) {
            st.isActive = false
            st.activeTime = 0
            st.underTime = 0
          }
        } else {
          // optional warning glow while charging
          if (playerUnder && st.underTime > 0.2) {
            ctx.fillStyle = 'rgba(220,38,38,0.35)'
            ctx.fillRect(lx + lw / 2 - 2, ceilingBottom, 4, 14)
          }
        }
      }

      // gravity wells: render faint upward particles and apply reduced gravity inside zone
      const inWell = (() => {
        for (const w of wells) {
          const ww = w.wellWidth ?? 240
          if (playerWorldX + 20 > w.x && playerWorldX < w.x + ww) return w
        }
        return null
      })()
      // visual particles rising from ground to ceiling within well bounds
      for (const w of wells) {
        const ww = w.wellWidth ?? 240
        const sx = w.x - cameraX
        // draw a few faint gradient particles columns
        const cols = Math.max(6, Math.floor(ww / 40))
        for (let i = 0; i < cols; i++) {
          const x = sx + (i + 0.5) * (ww / cols)
          // multiple small vertical streaks
          for (let j = 0; j < 4; j++) {
            const offset = ((performance.now() / 1000 + i * 0.13 + j * 0.29) % 1) * (groundTop - ceilingBottom)
            const y = groundTop - offset
            const len = 20
            const alpha = 0.12
            const grad = ctx.createLinearGradient(x, y, x, y - len)
            grad.addColorStop(0, `rgba(147,197,253,${alpha})`) // blue-ish
            grad.addColorStop(1, `rgba(236,72,153,${alpha * 0.4})`) // faint pink
            ctx.strokeStyle = grad
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x, y - len)
            ctx.stroke()
          }
        }
      }

      // player physics
      if (!isDeadRef.current) {
        if (held.left) vx = Math.max(vx - accel, -maxSpeed)
        if (held.right) vx = Math.min(vx + accel, maxSpeed)
        if (!held.left && !held.right) vx *= friction
        // wind push while airborne
        const inWind = winds.find(w => {
          const ww = w.windWidth ?? 2000
          return playerWorldX + 20 > w.x && playerWorldX < w.x + ww
        })
        if (inWind && playerY < groundTop) {
          vx += (inWind.pushForce ?? 0.35)
        }
        playerWorldX = Math.max(0, playerWorldX + vx)
      } else {
        vx *= 0.92
        playerWorldX = Math.max(0, playerWorldX + vx)
      }

      // apply gravity scale when inside a gravity well
      const gScale = inWell ? (inWell.gravityScale ?? 0.4) : 1
      const reverseMul = inReverse ? -1 : 1
      vy += (isDeadRef.current ? gravity * 0.4 : gravity) * gScale * reverseMul
      playerY = playerY + vy
      // ceiling collision
      if (reverseMul === 1) {
        if (playerY - 20 < ceilingBottom) {
          playerY = ceilingBottom + 20
          vy = 0
        }
      } else {
        // ceiling becomes ground; prevent crossing ceilingBottom
        if (playerY - 20 < ceilingBottom) {
          playerY = ceilingBottom + 20
          vy = 0
        }
      }
      // ground collision (skip when over a hole)
      const overHole = (() => {
        for (const h of holes) {
          const hw = h.width ?? 80
          if (playerWorldX + 20 > h.x && playerWorldX < h.x + hw) return true
        }
        return false
      })()
      const overLava = (() => {
        for (const seg of lavaSegments) {
          if (playerWorldX + 20 > seg.start && playerWorldX < seg.end) return true
        }
        return false
      })()
      if (reverseMul === 1) {
        if (!overHole && playerY >= groundTop) {
          playerY = groundTop
          vy = 0
        }
      } else {
        // in reverse gravity, treat ceiling as ground already handled above
      }
      // death on lava ground contact
      if (overLava && playerY >= groundTop && !isDeadRef.current) {
        triggerDeath()
      }

      // death when exiting screen bounds (bottom or top)
      if ((playerY >= H - 1 || playerY <= 1) && !isDeadRef.current) {
        triggerDeath()
      }
      // draw player or death effect
      if (!isDeadRef.current) {
        ctx.fillStyle = '#4f46e5'
        ctx.fillRect(playerWorldX - cameraX, playerY - 20, 20, 20)
      } else {
        // particles-only explosion (no lingering pixel ghost)
        ctx.fillStyle = '#a58aff'
        for (let k = particlesRef.current.length - 1; k >= 0; k--) {
          const part = particlesRef.current[k]
          part.life -= 1 / 60
          part.vy += gravity * 0.4
          part.x += part.vx / 60
          part.y += part.vy / 60
          ctx.globalAlpha = Math.max(0, Math.min(1, part.life))
          ctx.fillRect(part.x - cameraX, part.y, part.size, part.size)
          ctx.globalAlpha = 1
          if (part.life <= 0) particlesRef.current.splice(k, 1)
        }
        deathTimerRef.current += 1 / 60
      }

      // obstacles (red = death, green = safe platforms)
      for (const o of obstacles) {
        ctx.fillStyle = o.safe ? '#22c55e' : '#ef4444'
        ctx.fillRect(o.x - cameraX, groundTop - o.h, o.w, o.h)
        // spikes on safe blocks
        if (o.safe && o.spikes) {
          const spikeCount = Math.max(3, Math.floor(o.w / 8))
          const spikeWidth = o.w / spikeCount
          const spikeHeight = 8
          ctx.fillStyle = '#f87171'
          for (let i = 0; i < spikeCount; i++) {
            const sx = o.x - cameraX + i * spikeWidth
            const sy = groundTop - o.h
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(sx + spikeWidth / 2, sy - spikeHeight)
            ctx.lineTo(sx + spikeWidth, sy)
            ctx.closePath()
            ctx.fill()
          }
        }
      }

      // draw swings again on top to ensure visibility
      const swings = features.filter(f => f.kind === 'swing-ball')
      for (const s of swings) {
        const rope = s.ropeLength ?? 140
        const r = (s as any).swingRadius ?? 12
        const speed = (s.swingSpeed ?? 1.0)
        const t = performance.now() / 1000
        const meters = playerWorldX / 10
        const difficulty = Math.max(0, Math.floor(meters / 500))
        const angle = Math.sin(t * (0.8 + 0.2 * difficulty) * speed) * (Math.PI / 5)
        const pivotX = s.x
        const pivotY = ceilingBottom
        const ballX = pivotX + Math.sin(angle) * rope
        const ballY = pivotY + Math.cos(angle) * rope
        ctx.strokeStyle = '#9ca3af'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pivotX - cameraX, pivotY)
        ctx.lineTo(ballX - cameraX, ballY)
        ctx.stroke()
        ctx.fillStyle = '#fbbf24'
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.beginPath()
        ctx.arc(ballX - cameraX, ballY, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      // platform/death collision (resolve both vertical and horizontal)
      let landedOnSafe = false
      const playerRect = { x: playerWorldX, y: playerY - 20, w: 20, h: 20 }
      for (const o of obstacles) {
        const rect = { x: o.x, y: groundTop - o.h, w: o.w, h: o.h }
        // skip ghost blocks when invisible
        if (ghosts.find(g => g.x === o.x)) {
          const g = ghosts.find(g => g.x === o.x)!
          const period = g.period ?? 2
          const on = Math.floor(time / (period / 2)) % 2 === 0
          if (!on) continue
        }
        // move moving blocks along their path
        const mb = movers.find(m => m.x === o.x)
        if (mb) {
          const dir = mb.dir ?? 'horizontal'
          const range = mb.range ?? 180
          const speed = mb.speed ?? 2
          const phase = Math.sin(time * speed)
          rect.x = mb.x + (dir === 'horizontal' ? ((phase + 1) * 0.5) * range : 0)
          rect.y = groundTop - o.h - (dir === 'vertical' ? ((phase + 1) * 0.5) * range : 0)
        }
        // falling platforms: once landed, start dropping
        const fp = fallers.find(f => f.x === o.x)
        const intersects =
          playerRect.x < rect.x + rect.w &&
          playerRect.x + playerRect.w > rect.x &&
          playerRect.y < rect.y + rect.h &&
          playerRect.y + playerRect.h > rect.y
        if (!intersects) continue

        // deadly blocks: any intersection triggers death
        if (!o.safe) {
          if (!isDeadRef.current) triggerDeath()
          continue
        }

        // resolve collision on the axis of least penetration
        const overlapX = (playerRect.x + playerRect.w) - rect.x < (rect.x + rect.w) - playerRect.x
          ? (playerRect.x + playerRect.w) - rect.x
          : (rect.x + rect.w) - playerRect.x
        const overlapY = (playerRect.y + playerRect.h) - rect.y < (rect.y + rect.h) - playerRect.y
          ? (playerRect.y + playerRect.h) - rect.y
          : (rect.y + rect.h) - playerRect.y

        if (overlapX < overlapY) {
          // push out horizontally
          if (playerRect.x < rect.x) {
            // player on left -> push left
            playerWorldX -= overlapX
          } else {
            // player on right -> push right
            playerWorldX += overlapX
          }
          vx = 0
        } else {
          // push out vertically
          if (playerRect.y < rect.y) {
            // landed on top
            playerY = rect.y
            vy = 0
            landedOnSafe = true
            if (springs.find(sp => sp.x === o.x)) {
              // spring boost
              const sp = springs.find(sp => sp.x === o.x)!
              vy = -(sp.boost ?? 16)
            }
            if (fp) {
              // start dropping after delay
              const delay = fp.dropDelay ?? 0.4
              rect.y += 100 * delay
            }
            // deadly spikes on safe blocks
            if (o.safe && o.spikes) {
              // if player's feet are within spike height region above block top, kill
              const spikeHeight = 8
              if (playerY <= rect.y + spikeHeight && !isDeadRef.current) {
                triggerDeath()
              }
            }
          } else {
            // hit from below (ceiling of block)
            playerY = rect.y + rect.h + 20
            vy = Math.min(vy, 0)
          }
        }
        // update playerRect after resolution
        playerRect.x = playerWorldX
        playerRect.y = playerY - 20
      }
      // prevent sinking into ground if not on a platform and not over hole
      if (!landedOnSafe && !overHole && playerY >= groundTop) {
        playerY = groundTop
        vy = 0
      }

      // update jump availability: on ground or safely landed on a platform
      canJump = landedOnSafe || playerY === groundTop

      // if death animation finished, show game over overlay and stop
      if (isDeadRef.current && deathTimerRef.current > 1.6 && particlesRef.current.length === 0) {
        setRunning(false)
        cancelAnimationFrame(raf!)
        raf = null
        isDeadRef.current = false
        deathTimerRef.current = 0
        particlesRef.current = []
        // draw overlay once
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over - Press Start', W / 2, H / 2 - 20)
        ctx.fillText(`Distance: ${Math.floor(distance)}m`, W / 2, H / 2 + 20)
        return
      }

      // distance counter (pixels to meters approx)
      setDistance(meters)

      raf = requestAnimationFrame(loop)
    }

    if (running) raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [running, difficulty])

  return (
    <section className={styles.wrapper}>
      <h1 className={styles.title}>Block Runner</h1>
      <div className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-label="Block Runner canvas" />
        <div className={styles.controls}>
          {!running && (
            <div className={styles.overlay}>
              <div className={styles.difficultyRow}>
                <button className={styles.button} style={{ marginRight: 8 }} onClick={() => { setDifficulty('easy'); setRunning(true) }}>Easy</button>
                <button className={styles.button} style={{ marginRight: 8 }} onClick={() => { setDifficulty('medium'); setRunning(true) }}>Medium</button>
                <button className={styles.button} onClick={() => { setDifficulty('hard'); setRunning(true) }}>Hard</button>
              </div>
            </div>
          )}
          <span className={styles.hint}>Press Space to jump</span>
          <span className={styles.hint}>Distance: {Math.floor(distance)}m</span>
        </div>
        <LobbySidebar />
      </div>
    </section>
  )
}

function LobbySidebar() {
  const { state, joinLobby, setReady, startGame, createLobbyCode, connection, leaveLobby } = useLobby()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')
  const [lobbyCode, setLobbyCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [lobbies, setLobbies] = useState<Array<{ lobbyCode: string; leaderName: string; playersCount: number }>>([])
  const [lobbiesStatus, setLobbiesStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [lobbiesUpdatedAt, setLobbiesUpdatedAt] = useState<string>('')
  const [envDiag, setEnvDiag] = useState<{ base?: string; negotiate?: string; hub?: string }>({})
  const [lastFetchPreview, setLastFetchPreview] = useState<string>('')
  // removed unused raw toggle for diagnostics

  useEffect(() => {
    const base = (import.meta as any).env?.VITE_FUNC_BASE as string | undefined
    const negotiate = (import.meta as any).env?.VITE_NEGOTIATE_URL as string | undefined
    const hub = (import.meta as any).env?.VITE_PUBSUB_HUB as string | undefined
    setEnvDiag({ base, negotiate, hub })
    let timer: any
    async function load() {
      if (!base) return
      try {
        setLobbiesStatus('loading')
        const res = await fetch(`${base}/api/lobbies`)
        if (res.ok) {
          const data = await res.json()
          setLobbies((data?.lobbies || []).slice(0, 25))
          setLobbiesStatus('ok')
          setLobbiesUpdatedAt(new Date().toLocaleTimeString())
          try { setLastFetchPreview(JSON.stringify(data).slice(0, 240)) } catch {}
          console.log('Lobbies fetched OK', data)
        } else {
          setLobbiesStatus('error')
          const txt = await res.text().catch(() => '')
          setLastFetchPreview(`${res.status} ${txt}`.slice(0, 240))
          console.warn('Lobbies fetch failed', res.status, txt)
        }
      } catch (e) {
        setLobbiesStatus('error')
        try { setLastFetchPreview(String(e).slice(0, 240)) } catch {}
        console.error('Lobbies fetch error', e)
      }
    }
    load()
    timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  const colors = ['#ef4444','#22c55e','#3b82f6','#a855f7','#f59e0b','#ec4899']

  const join = () => {
    if (!name.trim()) return alert('Enter a name')
    if (!lobbyCode.trim()) return alert('Enter a lobby code')
    joinLobby({ lobbyCode, name, color })
    setJoined(true)
  }

  const create = () => {
    const code = createLobbyCode()
    setLobbyCode(code)
    // Advertise immediately so others can see it before you join
    const base = (import.meta as any).env?.VITE_FUNC_BASE as string | undefined
    if (base) {
      const leaderName = name.trim() || 'Player'
      const payload = { lobbyCode: code, leaderId: 'preview', leaderName, color, status: 'open', playersCount: 0 }
      fetch(`${base}/api/lobby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.headerRow}>
        <strong>Lobby</strong>
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>
          {connection === 'idle' ? 'Idle' : connection === 'connecting' ? 'Connecting…' : connection === 'connected' ? 'Connected' : 'Error'}
        </span>
      </div>
      {!joined ? (
        <div className={styles.form}>
          <label>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Player" />
          </label>
          <div className={styles.colors}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Color</div>
            <div className={styles.swatches}>
              {colors.map(c => (
                <button key={c} className={styles.swatch} style={{ background: c, outline: c===color? '2px solid #111':'none' }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <label>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Lobby Code</div>
            <input value={lobbyCode} onChange={e => setLobbyCode(e.target.value.toUpperCase())} placeholder="ABC12" />
          </label>
          <div className={styles.row}>
            <button className={styles.button} onClick={create}>Create</button>
            <button className={styles.button} onClick={join}>Join</button>
          </div>
          <AvailableLobbies lobbies={lobbies} onSelect={code => setLobbyCode(code)} />
          <Diagnostics statusLabel={lobbiesStatus} updatedAt={lobbiesUpdatedAt} env={envDiag} preview={lastFetchPreview} />
        </div>
      ) : (
        <div>
          <div className={styles.row}>
            <span>Lobby: {lobbyCode}</span>
            <button className={styles.button} onClick={() => navigator.clipboard.writeText(lobbyCode)}>Copy</button>
            <button className={styles.button} onClick={() => { leaveLobby(); setJoined(false); setLobbyCode(''); }}>Leave Lobby</button>
          </div>
          <div className={styles.party}>
            {(state.players ?? []).map((p: Player) => (
              <div key={p.id} className={styles.member}>
                <span className={styles.dot} style={{ background: p.color }} />
                <span>{p.name}{p.isLeader ? ' (Leader)' : ''}</span>
                <span className={styles.ready}>{p.ready ? 'Ready' : 'Not Ready'}</span>
              </div>
            ))}
          </div>
          <div className={styles.row}>
            <button className={styles.button} onClick={() => setReady(!state.self?.ready)}>Ready</button>
            <button className={styles.button} onClick={() => startGame()} disabled={!state.self?.isLeader}>Start</button>
          </div>
          <AvailableLobbies lobbies={lobbies} onSelect={code => setLobbyCode(code)} />
          <Diagnostics statusLabel={lobbiesStatus} updatedAt={lobbiesUpdatedAt} env={envDiag} preview={lastFetchPreview} />
        </div>
      )}
    </aside>
  )
}

function AvailableLobbies({ lobbies, onSelect }: { lobbies: Array<{ lobbyCode: string; leaderName: string; playersCount: number }>; onSelect: (code: string) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Available Lobbies</div>
        <button className={styles.button} style={{ padding:'2px 6px', fontSize:12 }} onClick={() => location.reload()}>Refresh</button>
      </div>
      {lobbies.length === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 12 }}>No active lobbies yet</div>
      ) : (
        <div className={styles.party}>
          {lobbies.map(l => (
            <div key={l.lobbyCode} className={styles.member}>
              <span>{l.lobbyCode}</span>
              <span style={{ opacity: 0.8 }}>by {l.leaderName}</span>
              <span className={styles.ready}>{l.playersCount} player(s)</span>
              <button className={styles.button} style={{ marginLeft: 8 }} onClick={() => onSelect(l.lobbyCode)}>Join</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Diagnostics({ statusLabel, updatedAt, env, preview }: { statusLabel: 'idle'|'loading'|'ok'|'error'; updatedAt: string; env?: { base?: string; negotiate?: string; hub?: string }; preview?: string }) {
  const color = statusLabel === 'ok' ? '#22c55e' : statusLabel === 'loading' ? '#f59e0b' : statusLabel === 'error' ? '#ef4444' : '#9ca3af'
  return (
    <div style={{ marginTop: 6, fontSize: 12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ color }}>Status: {statusLabel}</span>
        {updatedAt && <span style={{ opacity:0.7 }}>Updated: {updatedAt}</span>}
      </div>
      <div style={{ marginTop:4, opacity:0.8 }}>
        <div>Base: {env?.base || '(unset)'}</div>
        <div>Negotiate: {env?.negotiate || '(unset)'}</div>
        <div>Hub: {env?.hub || '(unset)'}</div>
        {preview && <div style={{ marginTop:4 }}>Last fetch: {preview}</div>}
      </div>
    </div>
  )
}
