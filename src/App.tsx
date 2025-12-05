import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BlockRunner from './pages/block_runner/BlockRunner'
import Lobby from './pages/multiplayer/Lobby'
import Navbar from './components/navbar'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Default route goes to Block Runner */}
        <Route path="/" element={<Navigate to="/runner" replace />} />
        <Route path="/runner" element={<BlockRunner />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* Aliases for legacy paths */}
        <Route path="/games/block-runner" element={<BlockRunner />} />
        <Route path="/games/lobby" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  )
}
