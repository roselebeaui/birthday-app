import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BlockRunner from './pages/block_runner/BlockRunner'
import Lobby from './pages/multiplayer/Lobby'

function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>Welcome! Choose a mode from the navbar.</p>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/runner" element={<BlockRunner />} />
        <Route path="/lobby" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  )
}
