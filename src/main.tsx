import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './navigation/Layout'
import Home from './pages/home/Home'
import RankingGrossFood from './pages/food_ranking/RankingGrossFood'
import BlockRunner from './pages/block_runner/BlockRunner'
import LoversGallery from './pages/gallery/LoversGallery'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: '/games/food-ranking', element: <RankingGrossFood /> },
      { path: '/games/block-runner', element: <BlockRunner /> },
      { path: '/gallery/lovers', element: <LoversGallery /> },
      
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
