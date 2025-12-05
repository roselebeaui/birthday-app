import type { Feature } from './types'

export const hole = (x: number, width = 80): Feature => ({ kind: 'hole', x, width })
export const block = (x: number, width = 32, height = 32, safe = false, spikes = false): Feature => ({ kind: 'block', x, width, height, safe, spikes })
export const doubleBlock = (x: number, gap = 40, size = 32): Feature[] => [
  { kind: 'block', x, width: size, height: size },
  { kind: 'block', x: x + size + gap, width: size, height: size },
]
export const stairs = (x: number, steps = 4, size = 28, rise = 20): Feature[] => {
  // Ensure each step is flush with the next: no horizontal gaps
  return Array.from({ length: steps }, (_, i) => ({
    kind: 'block',
    x: x + i * size, // flush spacing
    width: size,
    height: size + i * rise,
    safe: true,
  }))
}

// Ceiling laser emitter. When the player passes under the emitter range, a beam renders to the floor.
export const laser = (x: number, activeWidth = 40): Feature => ({ kind: 'laser', x, activeWidth })

// Sentry turret on the ground that tracks and fires when player is within a cone.
export const turret = (
  x: number,
  width = 20,
  height = 20,
  fireRate = 1.5,
  coneAngle = Math.PI / 6, // 30° half-angle
  coneLength = 260,
): Feature => ({ kind: 'turret', x, width, height, fireRate, coneAngle, coneLength })

// Swing ball pendulum from ceiling
export const swingBall = (
  x: number,
  ropeLength = 200,
  radius = 12,
  swingSpeed = 2.0,
): Feature => ({ kind: 'swing-ball', x, ropeLength, swingRadius: radius, swingSpeed })

// Gravity well: lower gravity in a horizontal zone. Visualized by faint upward particles.
export const gravityWell = (
  x: number,
  // width in meters; 500m default -> 5000 world units
  wellWidthMeters = 500,
  gravityScale = 0.3,
): Feature => ({ kind: 'gravity-well', x, wellWidth: wellWidthMeters * 10, gravityScale })

// Moving Block — platform that moves horizontally or vertically.
export const movingBlock = (
  x: number,
  width = 32,
  height = 32,
  dir: 'horizontal' | 'vertical' = 'horizontal',
  range = 180,
  speed = 2.0,
  safe = true,
): Feature => ({ kind: 'moving-block', x, width, height, dir, range, speed, safe })

// Falling Platform — drops after player steps on it.
export const fallingPlatform = (
  x: number,
  width = 36,
  height = 12,
  dropDelay = 0.4,
): Feature => ({ kind: 'falling-platform', x, width, height, dropDelay, safe: true })

// Spring / Bounce Pad — launches the player upward.
export const springPad = (
  x: number,
  width = 28,
  height = 10,
  boost = 16,
): Feature => ({ kind: 'spring-pad', x, width, height, boost, safe: true })

// Rolling Boulder — large rolling hazard from left or right.
export const boulder = (
  x: number,
  radius = 18,
  direction: 'left' | 'right' = 'right',
  speed = 3,
): Feature => ({ kind: 'boulder', x, boulderRadius: radius, direction, speed })

// Collapsing Bridge — bridge segments that break one by one.
export const bridge = (
  x: number,
  segments = 6,
  segmentWidth = 36,
  breakInterval = 0.6,
): Feature => ({ kind: 'bridge', x, segments, segmentWidth, breakInterval, safe: true })

// Wind Zone — pushes the player sideways in midair.
export const windZone = (
  x: number,
  // meters
  widthMeters = 200,
  pushForce = 0.35,
): Feature => ({ kind: 'wind-zone', x, windWidth: widthMeters * 10, pushForce })

// Reverse Gravity Zone — flips gravity; player runs on the ceiling.
export const reverseGravity = (
  x: number,
  // meters
  widthMeters = 180,
): Feature => ({ kind: 'reverse-gravity', x, zoneWidth: widthMeters * 10 })

// Sawblade — moving circular hazard (horizontal/vertical).
export const sawblade = (
  x: number,
  pathLength = 220,
  speed = 2.2,
  dir: 'horizontal' | 'vertical' = 'horizontal',
  radius = 12,
): Feature => ({ kind: 'sawblade', x, pathLength, speed, dir, swingRadius: radius })

// Rising Lava / Slime — rising floor that forces the player to run.
export const risingLava = (
  x: number,
  riseRate = 0.8,
): Feature => ({ kind: 'rising-lava', x, riseRate })

// Ghost Block — platform that disappears/reappears on a timer.
export const ghostBlock = (
  x: number,
  width = 32,
  height = 32,
  period = 2.0,
): Feature => ({ kind: 'ghost-block', x, width, height, period, safe: true })

// Shooter / Shooty Flower — enemy that fires projectiles periodically.
export const shooter = (
  x: number,
  width = 18,
  height = 18,
  projectileRate = 0.8,
): Feature => ({ kind: 'shooter', x, width, height, projectileRate })

// Teleporter Gate — instantly sends player to another location.
export const teleporter = (
  x: number,
  targetX: number,
): Feature => ({ kind: 'teleporter', x, targetX })

// Confetti Cannon (Brain Rot Bonus) — harmless confetti that blocks visibility.
export const confettiCannon = (
  x: number,
  density = 0.6,
): Feature => ({ kind: 'confetti', x, density })
 