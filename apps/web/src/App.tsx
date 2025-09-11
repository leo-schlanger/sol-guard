import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { TokenAnalysisPage } from '@/pages/TokenAnalysisPage'
import { DashboardPage } from '@/pages/DashboardPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze/:address" element={<TokenAnalysisPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}

export default App
