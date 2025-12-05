import { useState } from 'react'
import { useLobby } from './useLobby'
type Player = { id: string; name: string; color: string; ready: boolean; isLeader: boolean }
import styles from './Lobby.module.css'

export default function Lobby() {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')
  const [lobbyCode, setLobbyCode] = useState('')
  const [joined, setJoined] = useState(false)
  const { state, joinLobby, setReady, startGame, createLobbyCode, connection } = useLobby()

  const colors = ['#ef4444','#22c55e','#3b82f6','#a855f7','#f59e0b','#ec4899']

  const join = () => {
    if (!name.trim()) return alert('Enter a name')
    if (!lobbyCode.trim()) return alert('Enter a lobby code')
    joinLobby({ lobbyCode, name, color })
    setJoined(true)
  }

  const createLobby = () => {
    const code = createLobbyCode()
    setLobbyCode(code)
  }

  return (
    <section className={styles.wrapper}>
      <h1 className={styles.title}>Multiplayer Lobby</h1>
      {!joined ? (
        <div className={styles.form}>
          <label>
            <span>Name</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Player" />
          </label>
          <div className={styles.colors}>
            <span>Color</span>
            <div className={styles.swatches}>
              {colors.map(c => (
                <button key={c} className={styles.swatch} style={{ background: c, outline: c===color? '2px solid #111':'none' }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <label>
            <span>Lobby Code</span>
            <input value={lobbyCode} onChange={e => setLobbyCode(e.target.value.toUpperCase())} placeholder="ABC12" />
          </label>
          <div className={styles.row}>
            <button className={styles.button} onClick={createLobby}>Create Lobby</button>
            <button className={styles.button} onClick={join}>Join Lobby</button>
          </div>
        </div>
      ) : (
        <div className={styles.lobby}>
          <div className={styles.header}>
            <span>Lobby: {lobbyCode}</span>
            <button className={styles.button} onClick={() => navigator.clipboard.writeText(lobbyCode)}>Copy Code</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>
              Connection: {connection === 'idle' ? 'Idle' : connection === 'connecting' ? 'Connecting…' : connection === 'connected' ? 'Connected' : 'Error'}
            </span>
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
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => setReady(!state.self?.ready)}>Ready Up</button>
            <button className={styles.button} onClick={() => startGame()} disabled={!state.self?.isLeader}>Start Game (Leader)</button>
          </div>
        </div>
      )}
    </section>
  )
}
