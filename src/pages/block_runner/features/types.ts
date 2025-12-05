export type FeatureKind =
  | 'hole'
  | 'double-block'
  | 'stairs'
  | 'block'
  | 'laser'
  | 'turret'
  | 'swing-ball'
  | 'gravity-well'
  | 'moving-block'
  | 'falling-platform'
  | 'spring-pad'
  | 'boulder'
  | 'bridge'
  | 'wind-zone'
  | 'reverse-gravity'
  | 'sawblade'
  | 'rising-lava'
  | 'ghost-block'
  | 'shooter'
  | 'teleporter'
  | 'confetti'

export type Feature = {
  kind: FeatureKind
  x: number // world X where the feature starts
  width?: number
  height?: number
  safe?: boolean // safe platforms to stand on (green)
  spikes?: boolean // add spikes on top of safe blocks
  // laser-specific
  activeWidth?: number // horizontal width of the laser trigger/emitter
  // turret-specific
  fireRate?: number // bullets per second
  coneAngle?: number // radians for half-angle of detection cone
  coneLength?: number // how far the turret sees
  // swing-ball specific
  ropeLength?: number // pixels from ceiling to ball center
  swingRadius?: number // ball radius in pixels
  swingSpeed?: number // base angular velocity multiplier
  // gravity-well specific
  wellWidth?: number // horizontal width of the low-gravity zone
  gravityScale?: number // multiplier applied to gravity while inside the zone (e.g., 0.4)
  // moving-block
  dir?: 'horizontal' | 'vertical'
  speed?: number
  range?: number
  // falling-platform
  dropDelay?: number
  // spring-pad
  boost?: number
  // boulder
  boulderRadius?: number
  direction?: 'left' | 'right'
  // bridge
  segments?: number
  segmentWidth?: number
  breakInterval?: number
  // wind-zone
  windWidth?: number
  pushForce?: number
  // reverse-gravity
  zoneWidth?: number
  // sawblade
  pathLength?: number
  // rising-lava
  riseRate?: number
  // ghost-block
  period?: number
  // shooter
  projectileRate?: number
  // teleporter
  targetX?: number
  // confetti
  density?: number
}

export type FeatureRenderer = (ctx: CanvasRenderingContext2D, cameraX: number, H: number, groundTop: number) => void
