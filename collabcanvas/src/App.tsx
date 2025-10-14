import CanvasPage from './pages/CanvasPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <ProtectedRoute>
      <CanvasPage />
    </ProtectedRoute>
  )
}

export default App
