import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiMessageSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export const ChatRoomList: React.FC = () => {
  const { rooms, createRoom } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Mock users - in a real app, this would come from your API
  const availableUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateRoom = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      const roomId = await createRoom(
        Array.from(selectedUsers),
        newRoomName || undefined
      );
      
      // Reset form
      setNewRoomName('');
      setSelectedUsers(new Set());
      setIsCreatingRoom(false);
      
      // Navigate to the new room
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      // Show error to user
      alert('Failed to create room. Please try again.');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white w-80">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
          <button
            onClick={() => setIsCreatingRoom(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            aria-label="New chat"
          >
            <FiPlus size={20} />
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isCreatingRoom ? (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">New Chat</h3>
          
          <div className="mb-3">
            <input
              type="text"
              placeholder="Room name (optional)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Participants</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableUsers.map((user) => (
                <div key={user.id} className="flex items-center">
                  <input
                    id={`user-${user.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                  <label htmlFor={`user-${user.id}`} className="ml-2 block text-sm text-gray-700">
                    {user.name} <span className="text-gray-500">({user.email})</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsCreatingRoom(false);
                setSelectedUsers(new Set());
                setNewRoomName('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRoom}
              disabled={selectedUsers.size === 0}
              className={`flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedUsers.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Create
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FiMessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-gray-500 text-sm font-medium">No chats yet</h3>
            <p className="text-gray-400 text-xs mt-1">
              {searchQuery ? 'No matches found' : 'Start a new conversation'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreatingRoom(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Chat
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredRooms.map((room) => {
              const isActive = window.location.pathname.includes(room.id);
              return (
                <li key={room.id}>
                  <button
                    onClick={() => {
                      navigate(`/chat/${room.id}`);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {room.name || 
                            room.participants
                              .map(p => p.name)
                              .join(', ')
                              .substring(0, 30) + (room.participants.length > 1 ? '...' : '')}
                        </p>
                        {room.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            <span className="font-medium">
                              {room.lastMessage.sender.id === room.participants[0]?.id 
                                ? room.lastMessage.sender.name 
                                : 'You'}
                              : 
                            </span>{' '}
                            {room.lastMessage.content.substring(0, 40)}
                            {room.lastMessage.content.length > 40 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                        {room.lastMessage && (
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(room.lastMessage.timestamp), { addSuffix: true })}
                          </p>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="mt-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
