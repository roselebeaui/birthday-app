import { useEffect, useRef, useState } from 'react'

export type Player = { id: string; name: string; color: string; ready: boolean; isLeader: boolean }
export type LobbyState = { lobbyCode?: string; players: Player[]; started: boolean; self?: Player }

export function useLobby() {
  const [state, setState] = useState<LobbyState>({ players: [], started: false })
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const negotiateUrl = (import.meta as any).env?.VITE_NEGOTIATE_URL as string | undefined
  const hub = (import.meta as any).env?.VITE_PUBSUB_HUB as string | undefined

  // Placeholder client-side room until backend is wired
  const joinLobby = ({ lobbyCode, name, color }: { lobbyCode: string; name: string; color: string }) => {
    const id = crypto.randomUUID()
    const self: Player = { id, name, color, ready: false, isLeader: state.players.length === 0 }
    setState(s => ({ ...s, lobbyCode, self, players: [...s.players, self] }))
    // Advertise lobby as open for discovery
    advertiseLobby({ lobbyCode, leaderId: id, leaderName: name, color, status: 'open', playersCount: 1 }).catch(() => {})
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
        if (!resp.ok) { setConnection('error'); return }
        const data = await resp.json()
        const wsUrl = data?.url
        if (!wsUrl) { setConnection('error'); return }
        wsRef.current?.close()
        // Use Azure Web PubSub JSON subprotocol to manage groups + messages
        wsRef.current = new WebSocket(wsUrl, 'json.webpubsub.azure.v1')
        wsRef.current.onopen = () => {
          setConnection('connected')
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
                setState(s => ({ ...s, players: msg.players }))
              } else if (msg.kind === 'started') {
                setState(s => ({ ...s, started: !!msg.started }))
              } else if (msg.kind === 'join' && msg.player && msg.player.id !== self.id) {
                // Naive merge: add new player if not present
                setState(s => {
                  const exists = s.players.some(p => p.id === msg.player.id)
                  return exists ? s : { ...s, players: [...s.players, msg.player] }
                })
              } else if (msg.kind === 'ready' && msg.playerId) {
                setState(s => ({
                  ...s,
                  players: s.players.map(p => p.id === msg.playerId ? { ...p, ready: !!msg.ready } : p)
                }))
              }
            }
          } catch {}
        }
        wsRef.current.onclose = () => { setConnection('error') }
        wsRef.current.onerror = () => { setConnection('error') }
      } catch { setConnection('error') }
    }
    connect()
  }

  const setReady = (ready: boolean) => {
    setState(s => {
      const players = s.players.map(p => p.id === s.self?.id ? { ...p, ready } : p)
      const self = s.self ? { ...s.self, ready } : undefined
      return { ...s, players, self }
    })
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode && state.self) {
      const payload = { kind: 'ready', lobbyCode: state.lobbyCode, playerId: state.self.id, ready }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      wsRef.current.send(JSON.stringify(frame))
    }
  }

  const startGame = () => {
    setState(s => ({ ...s, started: true }))
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && state.lobbyCode && state.self?.isLeader) {
      const payload = { kind: 'started', lobbyCode: state.lobbyCode, started: true }
      const frame = { type: 'sendToGroup', group: state.lobbyCode, data: payload, dataType: 'json' }
      wsRef.current.send(JSON.stringify(frame))
    }
    // Mark lobby started so it no longer appears in discovery
    if (state.lobbyCode && state.self?.isLeader) {
      advertiseLobby({ lobbyCode: state.lobbyCode, leaderId: state.self.id, leaderName: state.self.name, color: state.self.color, status: 'started', playersCount: state.players.length }).catch(() => {})
    }
  }

  const createLobbyCode = () => Math.random().toString(36).substring(2, 7).toUpperCase()

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  return { state, joinLobby, setReady, startGame, createLobbyCode, connection }

  async function advertiseLobby(input: { lobbyCode: string; leaderId: string; leaderName: string; color: string; status: 'open'|'started'|'closed'; playersCount: number }) {
    const base = (import.meta as any).env?.VITE_FUNC_BASE as string | undefined
    if (!base) return
    await fetch(`${base}/api/lobby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  }
}
