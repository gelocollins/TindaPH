
import React, { useEffect, useState } from 'react';
import { chatService } from '../services/mockSupabase';
import { User, ChatThread, Message } from '../types';

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadThreads();
  }, [user]);

  const loadThreads = async () => {
    const data = await chatService.getThreads(user.id);
    setThreads(data);
    if (data.length > 0 && !activeThreadId && window.innerWidth >= 768) {
        setActiveThreadId(data[0].id);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newMessage.trim()) return;

    await chatService.sendMessage({
       from_user: user.id,
       to_user: activeThread.otherUser.id,
       listing_id: activeThread.listing.id,
       message: newMessage
    });
    setNewMessage('');
    loadThreads(); // Refresh to show new message
  };

  return (
    <div className="bg-white border md:rounded-2xl md:shadow-lg overflow-hidden h-[calc(100vh-140px)] flex md:mt-2">
      {/* Thread List (Sidebar) */}
      <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r bg-gray-50`}>
         <div className="p-4 border-b bg-white">
           <h2 className="font-bold text-lg">Messages</h2>
         </div>
         <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
               <p className="p-6 text-center text-gray-500 text-sm">No messages yet.</p>
            ) : (
               threads.map(thread => (
                 <div 
                   key={thread.id} 
                   onClick={() => setActiveThreadId(thread.id)}
                   className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition ${activeThreadId === thread.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''}`}
                 >
                    <div className="flex gap-3">
                       <img src={thread.listing.images[0]} className="w-12 h-12 rounded object-cover bg-gray-200" />
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate text-gray-900">{thread.otherUser.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{thread.listing.title}</p>
                          <p className={`text-xs mt-1 truncate ${thread.unreadCount > 0 ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
                             {thread.lastMessage.message}
                          </p>
                       </div>
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>

      {/* Chat Area */}
      {activeThread ? (
        <div className={`${activeThreadId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white h-full`}>
           {/* Chat Header */}
           <div className="p-3 border-b flex items-center gap-3 bg-white shadow-sm z-10">
              <button onClick={() => setActiveThreadId(null)} className="md:hidden text-gray-500 p-2">⬅</button>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                    {activeThread.otherUser.name[0]}
                 </div>
                 <div>
                    <h3 className="font-bold text-sm text-gray-900">{activeThread.otherUser.name}</h3>
                    <p className="text-xs text-gray-500">RE: {activeThread.listing.title} • ₱{activeThread.listing.price}</p>
                 </div>
              </div>
           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeThread.messages.map(msg => {
                 const isMe = msg.from_user === user.id;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`}>
                         {msg.message}
                      </div>
                   </div>
                 )
              })}
           </div>

           {/* Input */}
           <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition">
                 <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
           </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-col flex-1 items-center justify-center text-gray-400 bg-gray-50">
           <span className="text-4xl mb-2">💬</span>
           <p>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default Chat;
