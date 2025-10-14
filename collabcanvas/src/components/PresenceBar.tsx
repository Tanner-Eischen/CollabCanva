import { logOut } from '../services/auth'
import type { Presence } from '../types/firebase'

interface PresenceBarProps {
  currentUser: {
    displayName: string | null
    email: string | null
  }
  otherUsers: Map<string, Presence>
}

/**
 * PresenceBar - Top header showing online users and logout button
 */
export default function PresenceBar({ currentUser, otherUsers }: PresenceBarProps) {
  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Combine current user with other users for display
  const allUsers = [
    {
      name: currentUser.displayName || currentUser.email || 'You',
      color: '#3B82F6', // Blue for current user
      isSelf: true,
    },
    ...Array.from(otherUsers.values()).map((presence) => ({
      name: presence.n,
      color: presence.cl,
      isSelf: false,
    })),
  ]

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-gray-900 shadow-lg z-50 flex items-center justify-between px-6">
      {/* Logo/Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-white font-bold text-lg">CollabCanvas</h1>
      </div>

      {/* Online Users */}
      <div className="flex items-center space-x-3">
        <span className="text-gray-400 text-sm mr-2">
          {allUsers.length} online
        </span>

        {/* User chips */}
        <div className="flex items-center -space-x-2">
          {allUsers.map((user, index) => (
            <div
              key={index}
              className="relative group"
              style={{ zIndex: allUsers.length - index }}
            >
              {/* User avatar circle */}
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold shadow-lg"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {user.name}
                {user.isSelf && ' (You)'}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

