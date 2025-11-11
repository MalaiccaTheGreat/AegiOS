import React from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { ChatRoomList } from '../components/chat/ChatRoomList';
import { ChatInterface } from '../components/chat/ChatInterface';
import { ChatProvider } from '../contexts/ChatContext';

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();

  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar with chat list */}
        <div className="hidden md:block w-80 border-r border-gray-200 bg-white">
          <ChatRoomList />
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {roomId ? (
            <ChatInterface />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Welcome to Aegios Chat</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Select a conversation or start a new one to begin messaging.
                </p>
                <button
                  onClick={() => {
                    // This would be handled by the ChatRoomList's "New Chat" button
                    // which would be visible on mobile
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* For nested routes */}
      <Outlet />
    </ChatProvider>
  );
};

export default ChatPage;
