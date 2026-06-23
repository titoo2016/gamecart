import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import GameBoard from './components/GameBoard'
import { useTheme, themes } from './hooks/useTheme'

function App() {
  const [gameState, setGameState] = useState('landing') // landing, playing, stats, leaderboard
  const [nickname, setNickname] = useState('')
  const [isSpymaster, setIsSpymaster] = useState(false)
  const [roomId, setRoomId] = useState(null)
  const [players, setPlayers] = useState([])
  const [useAI, setUseAI] = useState(false)
  const [gameMode, setGameMode] = useState('classic') // classic, timed
  const [timeLimit, setTimeLimit] = useState(60) // seconds
  const [isRoomCreator, setIsRoomCreator] = useState(false) // track if user created the room

  const { getTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState(getTheme())

  // Check if there's a room ID in the URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRoomId = params.get('room')
    if (urlRoomId) {
      setRoomId(urlRoomId)
      setGameState('landing')
    }

    // Listen for theme changes
    const handleStorageChange = () => {
      setCurrentTheme(getTheme())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const startGame = (playerNickname, spymaster) => {
    setNickname(playerNickname)
    setIsSpymaster(spymaster)
    setGameState('playing')
    
    // Add player to room
    const newPlayer = { nickname: playerNickname, isSpymaster: spymaster, id: Date.now() }
    setPlayers([...players, newPlayer])
  }

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    setIsRoomCreator(true) // Mark this user as room creator
    window.history.replaceState({}, '', `?room=${newRoomId}`)
    return newRoomId
  }

  const getRoomUrl = () => {
    if (!roomId) return ''
    return `${window.location.origin}${window.location.pathname}?room=${roomId}`
  }

  const themeClass = themes[currentTheme] || themes.dark
  const bgGradient = `${themeClass.bg}`

  return (
    <div className={`min-h-screen ${bgGradient}`}>
      {gameState === 'landing' ? (
        <LandingPage 
          onStartGame={startGame}
          roomId={roomId}
          onCreateRoom={createRoom}
          roomUrl={getRoomUrl()}
          players={players}
          onNavigate={setGameState}
          useAI={useAI}
          setUseAI={setUseAI}
          gameMode={gameMode}
          setGameMode={setGameMode}
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          isRoomCreator={isRoomCreator}
          setIsRoomCreator={setIsRoomCreator}
        />
      ) : (
        <GameBoard 
          nickname={nickname} 
          isSpymaster={isSpymaster}
          onBackToMenu={() => {
            setGameState('landing')
            setPlayers([])
          }}
          roomId={roomId}
          players={players}
          useAI={useAI}
          gameMode={gameMode}
          timeLimit={timeLimit}
        />
      )}
    </div>
  )
}

export default App
