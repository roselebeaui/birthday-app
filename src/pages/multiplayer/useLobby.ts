import { useEffect, useRef, useState } from 'react'

export type Player = { id: string; name: string; color: string; ready: boolean; isLeader: boolean; alive: boolean; status?: 'Not Ready'|'Ready'|'Deceased' }
export type LobbyState = {
  lobbyCode?: string;
  players: Player[];
  started: boolean;
  self?: Player;
  difficulty?: 'easy'|'medium'|'hard';
  playerPositions: Record<string, { x: number; y: number; t: number }>;
  distances: Record<string, number>;
  roundResults?: Array<{ playerId: string; name: string; distance: number }>
  connError?: string;
}

export function useLobby() {
  const [state, setState] = useState<LobbyState>({ players: [], started: false, playerPositions: {}, distances: {}, connError: '' })
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const negotiateUrl = (import.meta as any).env?.VITE_NEGOTIATE_URL as string | undefined
  const hub = (import.meta as any).env?.VITE_PUBSUB_HUB as string | undefined
  const pingTimerRef = useRef<any>(null)

  // Placeholder client-side room until backend is wired
    const joinLobby = ({ lobbyCode, name, color, isLeader }: { lobbyCode: string; name: string; color: string; isLeader: boolean }) => {
    const id = crypto.randomUUID()
    const self: Player = { id, name, color, ready: false, isLeader, alive: true, status: 'Not Ready' }
    setState(s => ({ ...s, lobbyCode, self, players: [...s.players, self] }))
    // Do not advertise on join unless you are the leader; create flow will advertise
    if (isLeader) {
      advertiseLobby({ lobbyCode, leaderId: id, leaderName: name, color, status: 'open', playersCount: 1 }).catch(() => {})
    }
    // Connect and announce join if negotiate endpoint is configured
    const connect = async () => {
      if (!negotiateUrl) return
      try {
        setConnection('connecting')
        const resp = await fetch(negotiateUrl + (hub ? `?hub=${encodeURIComponent(hub)}` : ''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: self.id })
        })
        if (!resp.ok) { setConnection('error'); setState(s => ({ ...s, connError: `negotiate ${resp.status}` })); return }
        const data = await resp.json()
        const wsUrl = data?.url
        if (!wsUrl) { setConnection('error'); setState(s => ({ ...s, connError: 'missing ws url' })); return }
        wsRef.current?.close()
        // Use Azure Web PubSub JSON subprotocol to manage groups + messages
        wsRef.current = new WebSocket(wsUrl, 'json.webpubsub.azure.v1')
        wsRef.current.onopen = () => {
          setConnection('connected')
          // start keepalive ping every 30s to avoid idle closes
          try { if (pingTimerRef.current) clearInterval(pingTimerRef.current) } catch {}
          pingTimerRef.current = setInterval(() => {
            try {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                // Send a lightweight group ping so service sees activity on the hub/group
                if (state.lobbyCode) {
                  const payload = { kind: 'ping' }
                  const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
                  wsRef.current.send(JSON.stringify(frame))
                }
              }
            } catch {}
          }, 15000)
          // Join a group per lobbyCode so messages are scoped
          const joinFrame = { type: 'joinGroup', group: lobbyCode }
          wsRef.current?.send(JSON.stringify(joinFrame))
          // Broadcast a logical join message to the group
          const payload = { kind: 'join', lobbyCode, player: self }
          const sendFrame = { type: 'sendToGroup', group: lobbyCode, data: payload, dataType: 'json' }
          wsRef.current?.send(JSON.stringify(sendFrame))
        }
        wsRef.current.onmessage = ev => {
          try {
            const envelope = JSON.parse(ev.data)
            // We expect messages delivered as { type: 'message', from: 'group', group, data }
            if (envelope?.type === 'message' && envelope?.data) {
              const msg = envelope.data
              if (msg.kind === 'state') {
                setState(s => ({ ...s, ...msg.state }))
              } else if (msg.kind === 'players') {
                setState(s => {
                  const players: Player[] = (msg.players || []).map((p: any) => ({
                    id: String(p.id),
                    name: String(p.name || 'Player'),
                    color: String(p.color || '#10b981'),
                    ready: !!p.ready,
                    isLeader: !!p.isLeader,
                    alive: p.alive !== false,
                    status: p.status === 'Ready' ? 'Ready' : (p.status === 'Deceased' ? 'Deceased' : 'Not Ready')
                  }))
                  const self = s.self ? players.find(p => p.id === s.self!.id) || s.self : s.self
                  return { ...s, players, self }
                })
              } else if (msg.kind === 'started') {
                setState(s => ({ ...s, started: !!msg.started, difficulty: msg.difficulty }))
              } else if (msg.kind === 'difficulty') {
                setState(s => ({ ...s, difficulty: msg.difficulty }))
              } else if (msg.kind === 'pos' && msg.playerId && typeof msg.x === 'number' && typeof msg.y === 'number') {
                setState(s => {
                  const exists = s.players.some(p => p.id === msg.playerId)
                  const players = exists ? s.players : [...s.players, { id: String(msg.playerId), name: 'Player', color: '#10b981', ready: false, isLeader: false, alive: true, status: 'Not Ready' as const }]
                  return {
                    ...s,
                    players,
                    playerPositions: { ...s.playerPositions, [msg.playerId]: { x: msg.x, y: msg.y, t: Date.now() } }
                  }
                })
              } else if (msg.kind === 'join' && msg.player && msg.player.id !== self.id) {
                // Naive merge: add new player if not present
                setState(s => {
                  const exists = s.players.some(p => p.id === msg.player.id)
                  const next = exists ? s : { ...s, players: [...s.players, msg.player] }
                  // If we are leader, reflect player count to discovery
                  if (!exists && next.self?.isLeader && next.lobbyCode) {
                    advertiseLobby({ lobbyCode: next.lobbyCode, leaderId: next.self.id, leaderName: next.self.name, color: next.self.color, status: 'open', playersCount: next.players.length }).catch(() => {})
                    // Also broadcast full players list so newcomers sync immediately
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      const payload = { kind: 'players', lobbyCode: next.lobbyCode, players: next.players }
                      const frame = { type: 'sendToGroup', group: next.lobbyCode, data: payload, dataType: 'json' }
                      wsRef.current.send(JSON.stringify(frame))
                    }
                  }
                  return next
                })
              } else if (msg.kind === 'ready' && msg.playerId) {
                setState(s => {
                  const players = s.players.map(p => p.id === msg.playerId ? { ...p, ready: !!msg.ready, status: (!!msg.ready) ? 'Ready' as const : 'Not Ready' as const } : p)
                  const self = s.self && s.self.id === msg.playerId ? { ...s.self, ready: !!msg.ready, status: (!!msg.ready) ? 'Ready' as const : 'Not Ready' as const } : s.self
                  return { ...s, players, self }
                })
              } else if (msg.kind === 'dead' && msg.playerId) {
                setState(s => {
                  const next = {
                    ...s,
                    players: s.players.map(p => p.id === msg.playerId ? { ...p, alive: false, status: 'Deceased' as const } : p),
                    distances: msg.distance != null ? { ...s.distances, [msg.playerId]: msg.distance } : s.distances
                  }
                  // If all players are now dead and we are leader, announce round over with results
                  const allDeadNow = next.players.length > 0 && next.players.every(p => !p.alive)
                  if (allDeadNow && next.self?.isLeader && next.lobbyCode && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    const results = Object.entries(next.distances || {}).map(([pid, dist]) => {
                      const pl = (next.players || []).find(pp => pp.id === pid)
                      return { playerId: pid, name: pl?.name || 'Player', distance: dist as number }
                    })
                    const payload = { kind: 'roundOver', lobbyCode: next.lobbyCode, results }
                    const frame = { type: 'sendToGroup', group: next.lobbyCode, data: payload, dataType: 'json' }
                    wsRef.current.send(JSON.stringify(frame))
                  }
                  return next
                })
              } else if (msg.kind === 'roundOver') {
                setState(s => ({
                  ...s,
                  started: false,
                  players: (s.players || []).map(p => ({ ...p, ready: false, alive: true, status: 'Not Ready' as const })),
                  self: s.self ? { ...s.self, ready: false, alive: true, status: 'Not Ready' as const } : s.self,
                  roundResults: msg.results || Object.entries(s.distances || {}).map(([pid, dist]) => {
                    const pl = (s.players || []).find(pp => pp.id === pid)
                    return { playerId: pid, name: pl?.name || 'Player', distance: dist as number }
                  })
                }))
              }
            }
          } catch {}
        }
        wsRef.current.onclose = (ev) => {
          try { if (pingTimerRef.current) clearInterval(pingTimerRef.current) } catch {}
          setConnection('error');
          setState(s => ({ ...s, connError: `socket close ${ev.code}` }))
        }
        wsRef.current.onerror = () => {
          try { if (pingTimerRef.current) clearInterval(pingTimerRef.current) } catch {}
          setConnection('error');
          setState(s => ({ ...s, connError: 'socket error' }))
        }
      } catch (e: any) { setConnection('error'); setState(s => ({ ...s, connError: String(e) })) }
    }
    connect()
  }

  const setReady = (ready: boolean) => {
    const players = state.players.map(p => p.id === state.self?.id ? { ...p, ready, status: ready ? 'Ready' as const : 'Not Ready' as const } : p)
    const self = state.self ? { ...state.self, ready, status: ready ? 'Ready' as const : 'Not Ready' as const } : undefined
    const curr: LobbyState = { ...state, players, self }
    setState(curr)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && curr.lobbyCode && curr.self) {
      const payload = { kind: 'ready', lobbyCode: curr.lobbyCode, playerId: curr.self.id, ready }
      const frame = { type: 'sendToGroup', group: curr.lobbyCode, data: payload, dataType: 'json' }
      try { wsRef.current.send(JSON.stringify(frame)) } catch {}
      if (curr.self.isLeader) {
        const playersPayload = { kind: 'players', lobbyCode: curr.lobbyCode, players: curr.players.map(p => ({ ...p, status: p.ready ? 'Ready' as const : (p.alive ? 'Not Ready' as const : 'Deceased' as const) })) }
        const playersFrame = { type: 'sendToGroup', group: curr.lobbyCode, data: playersPayload, dataType: 'json' }
        try { wsRef.current.send(JSON.stringify(playersFrame)) } catch {}
      }
    }
  }

  const setLobbyDifficulty = (difficulty: 'easy'|'medium'|'hard') => {
    setState(s => ({ ...s, difficulty }))
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode) {
      const payload = { kind: 'difficulty', lobbyCode: state.lobbyCode, difficulty }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      try { wsRef.current.send(JSON.stringify(frame)) } catch {}
    }
  }

  const startGame = (difficulty: 'easy'|'medium'|'hard') => {
    // Only allow leader to start when all players are ready
    const allReady = state.players.length > 0 && state.players.every(p => p.ready)
    if (!state.self?.isLeader || !allReady) return
    setState(s => ({ ...s, started: true, difficulty, distances: {}, roundResults: undefined, players: s.players.map(p => ({ ...p, alive: true, status: p.ready ? 'Ready' : 'Not Ready' })) }))
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode) {
      const payload = { kind: 'started', lobbyCode: state.lobbyCode, started: true, difficulty }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      wsRef.current.send(JSON.stringify(frame))
    }
    // Mark lobby started so it no longer appears in discovery
    if (state.lobbyCode && state.self?.isLeader) {
        advertiseLobby({ lobbyCode: state.lobbyCode, leaderId: state.self.id, leaderName: state.self.name, color: state.self.color, status: 'started', playersCount: state.players.length }).catch(() => {})
    }
  }

  const leaveLobby = () => {
    if (state.lobbyCode && state.self) {
      // Mark lobby closed if leader leaves; otherwise just update player count on backend
      const status: 'closed' | 'open' = state.self.isLeader ? 'closed' : 'open'
        advertiseLobby({ lobbyCode: state.lobbyCode, leaderId: state.self.id, leaderName: state.self.name, color: state.self.color, status, playersCount: Math.max(0, state.players.length - 1) }).catch(() => {})
    }
    try { wsRef.current?.close() } catch {}
    setConnection('idle')
    setState({ players: [], started: false, playerPositions: {}, distances: {} })
  }

  const createLobbyCode = () => Math.random().toString(36).substring(2, 7).toUpperCase()

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      try { if (pingTimerRef.current) clearInterval(pingTimerRef.current) } catch {}
    }
  }, [])

  return { state, joinLobby, setReady, startGame, createLobbyCode, connection, leaveLobby, updatePosition, announceDeath, setLobbyDifficulty }

  // Emit local player position to the lobby group
  function updatePosition(x: number, y: number) {
    setState(s => ({ ...s, playerPositions: s.self ? { ...s.playerPositions, [s.self.id]: { x, y, t: Date.now() } } : s.playerPositions }))
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode && state.self) {
      const payload = { kind: 'pos', lobbyCode: state.lobbyCode, playerId: state.self.id, x, y }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      wsRef.current.send(JSON.stringify(frame))
    }
  }

  function announceDeath(distanceOverride?: number) {
    const distLocal = distanceOverride ?? (state.self?.id ? state.playerPositions?.[state.self.id]?.x ?? 0 : 0)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode && state.self) {
      const payload = { kind: 'dead', lobbyCode: state.lobbyCode, playerId: state.self.id, distance: distLocal }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      wsRef.current.send(JSON.stringify(frame))
    }
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === s.self?.id ? { ...p, alive: false, status: 'Deceased' } : p),
      distances: s.self?.id ? { ...s.distances, [s.self.id]: distLocal } : s.distances
    }))
  }

    async function advertiseLobby(input: { lobbyCode: string; leaderId: string; leaderName: string; color: string; status: 'open'|'started'|'closed'; playersCount: number }) {
    const base = (import.meta as any).env?.VITE_FUNC_BASE as string | undefined
    if (!base) return
    await fetch(`${base}/api/lobby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  }
}
