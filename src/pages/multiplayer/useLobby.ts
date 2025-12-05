import { useState } from 'react'

export type Player = { id: string; name: string; color: string; ready: boolean; isLeader: boolean }
export type LobbyState = { lobbyCode?: string; players: Player[]; started: boolean; self?: Player }

export function useLobby() {
  const [state, setState] = useState<LobbyState>({ players: [], started: false })

  // Placeholder client-side room until backend is wired
  const joinLobby = ({ lobbyCode, name, color }: { lobbyCode: string; name: string; color: string }) => {
    const id = crypto.randomUUID()
    const self: Player = { id, name, color, ready: false, isLeader: state.players.length === 0 }
    setState(s => ({ ...s, lobbyCode, self, players: [...s.players, self] }))
    // TODO: connect to WS server and send join message
    // wsRef.current = new WebSocket(import.meta.env.VITE_WS_URL)
  }

  const setReady = (ready: boolean) => {
    setState(s => {
      const players = s.players.map(p => p.id === s.self?.id ? { ...p, ready } : p)
      const self = s.self ? { ...s.self, ready } : undefined
      return { ...s, players, self }
    })
    // TODO: ws send ready change
  }

  const startGame = () => {
    setState(s => ({ ...s, started: true }))
    // TODO: ws send start game
  }

  const createLobbyCode = () => Math.random().toString(36).substring(2, 7).toUpperCase()

  return { state, joinLobby, setReady, startGame, createLobbyCode }
}
