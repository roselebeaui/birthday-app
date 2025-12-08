import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './navigation/Layout'
import Home from './pages/home/Home'
import RankingGrossFood from './pages/food_ranking/RankingGrossFood'
import BlockRunner from './pages/block_runner/BlockRunner'
import LoversGallery from './pages/gallery/LoversGallery'
import CatchMe from './pages/catch_me/CatchMe'
import SeeFuture from './pages/see_future/SeeFuture'
import BrainTeasers from './pages/brain_teasers/BrainTeasers'
import TestBasicVibe from './pages/brain_teasers/tests/BasicVibeLiteracy'
import TestDontOverthink from './pages/brain_teasers/tests/DontOverthinkIt'
import TestAreYouChill from './pages/brain_teasers/tests/AreYouChill'
import WordGuess from './pages/word_guess/WordGuess'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: '/games/food-ranking', element: <RankingGrossFood /> },
      { path: '/games/block-runner', element: <BlockRunner /> },
      { path: '/games/word-guess', element: <WordGuess /> },
      { path: '/gallery/lovers', element: <LoversGallery /> },
      { path: '/catch-me', element: <CatchMe /> },
      { path: '/games/see-your-future', element: <SeeFuture /> },
      { path: '/games/brain-teasers', element: <BrainTeasers /> },
      { path: '/games/brain-teasers/basic-vibe-literacy', element: <TestBasicVibe /> },
      { path: '/games/brain-teasers/dont-overthink-it', element: <TestDontOverthink /> },
      { path: '/games/brain-teasers/are-you-chill', element: <TestAreYouChill /> },
      
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
