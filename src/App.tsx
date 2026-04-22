import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Send, 
  Settings, 
  Search, 
  Trash2, 
  Sparkles, 
  Github, 
  MessageCircle, 
  Layers, 
  X, 
  Menu,
  Cloud,
  Eraser,
  Globe,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Memory {
  id: string;
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [searchWeb, setSearchWeb] = useState(true);
  
  const [settings, setSettings] = useState({
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 500
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let contextText = memories.map(m => m.text).join('\n');
      let searchResults = [];

      // Step 1: Search if enabled
      if (searchWeb) {
        const searchRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
        });
        const searchData = await searchRes.json();
        searchResults = searchData.results || [];
        
        // Step 2: Scrape top link for context
        if (searchResults.length > 0) {
          const scrapeRes = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: searchResults[0].link }),
          });
          const scrapeData = await scrapeRes.json();
          if (scrapeData.content) {
            const newMemory = { id: Date.now().toString(), text: scrapeData.content.substring(0, 500) };
            setMemories(prev => [newMemory, ...prev].slice(0, 5)); // Keep last 5
            contextText += '\n' + scrapeData.content;
          }
        }
      }

      // Step 3: Chat with AI
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          context: contextText,
          settings 
        }),
      });
      const chatData = await chatRes.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatData.content || 'Oh no! Something went wrong... (｡•́︿•̀｡)',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, {
        id: 'err',
        role: 'assistant',
        content: 'I lost connection to my brain! ૮(˶╥︿╥)ა Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-80 p-6 space-y-6 bg-brand-cream border-r-4 border-brand-pink/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand-pink rounded-2xl shadow-lg animate-float">
            <Heart className="text-white fill-white" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-pink tracking-tight">Lovely AI</h1>
            <p className="text-xs text-gray-400 font-medium italic">Your sweet companion ✨</p>
          </div>
        </div>

        {/* Memory Panel */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-brand-pink font-bold text-sm uppercase tracking-widest">
            <Database size={16} />
            <span>Short-term Memory</span>
          </div>
          {memories.length === 0 ? (
            <div className="p-4 bg-white/50 rounded-2xl border-2 border-dashed border-brand-pink/30 text-center text-xs text-gray-400 italic">
              Memories will appear here after searching... ₍^ {'>'} {'<'} ^₎
            </div>
          ) : (
            memories.map((m) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={m.id} 
                className="p-3 bg-white rounded-2xl border-2 border-brand-mint text-[10px] text-gray-500 line-clamp-3 relative group"
              >
                {m.text}
                <button 
                  onClick={() => setMemories(prev => prev.filter(v => v.id !== m.id))}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-500 rounded-lg transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between p-3 bg-brand-lavender text-white font-bold rounded-2xl hover:bg-brand-lavender/80 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <span>Settings</span>
            </div>
            <Sparkles size={16} />
          </button>
          
          <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-brand-pink text-brand-pink font-bold rounded-2xl hover:bg-brand-pink hover:text-white transition-all shadow-sm"
          >
            <Eraser size={18} />
            <span>Clear Chat</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white/40">
        {/* Header - Mobile & Stats */}
        <header className="p-4 flex items-center justify-between md:justify-end border-b-2 border-brand-pink/10 backdrop-blur-sm z-10">
          <button className="md:hidden p-2 text-brand-pink">
            <Menu />
          </button>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/80 px-3 py-1 rounded-full border border-gray-100">
               <div className={cn("w-2 h-2 rounded-full", searchWeb ? "bg-green-400" : "bg-gray-300")} />
               <Globe size={12} className={cn(searchWeb ? "text-brand-pink" : "text-gray-300")} />
               <span>Web Search: {searchWeb ? 'ON' : 'OFF'}</span>
             </div>
             <button 
              onClick={() => setSearchWeb(!searchWeb)}
              className={cn(
                "p-2 rounded-full transition-all shadow-sm",
                searchWeb ? "bg-brand-mint text-emerald-600" : "bg-gray-100 text-gray-400"
              )}
             >
               <Search size={20} />
             </button>
          </div>
        </header>

        {/* Chat Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-32 h-32 bg-brand-pink/20 rounded-full flex items-center justify-center animate-bounce">
                <MessageCircle size={64} className="text-brand-pink opacity-50" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-brand-pink">Hello there! (✿◠‿◠)</h2>
                <p className="text-gray-400 font-medium">How can I make your day sweeter today?</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id}
                className={cn(
                  "flex items-end gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm",
                  msg.role === 'user' ? "bg-brand-mint text-white" : "bg-brand-pink text-white"
                )}>
                  {msg.role === 'user' ? <Github size={16} /> : <Heart size={16} fill="white" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-3xl shadow-sm border-2",
                  msg.role === 'user' 
                    ? "bg-brand-mint/10 border-brand-mint text-gray-700 rounded-br-none" 
                    : "bg-white border-brand-pink/20 text-gray-700 rounded-bl-none"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 p-4 animate-pulse">
              <div className="w-2 h-2 bg-brand-pink rounded-full" />
              <div className="w-2 h-2 bg-brand-pink rounded-full animation-delay-200" />
              <div className="w-2 h-2 bg-brand-pink rounded-full animation-delay-400" />
              <span className="text-xs text-brand-pink font-bold italic ml-2">Pinky is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-brand-cream to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your lovely message here..."
              className="w-full pl-6 pr-16 py-5 bg-white/90 backdrop-blur-md border-4 border-brand-pink/30 rounded-[2rem] shadow-xl focus:outline-none focus:border-brand-pink transition-all placeholder:text-gray-300 font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 px-6 bg-brand-pink text-white rounded-[1.5rem] shadow-lg hover:bg-brand-pink/80 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Overlay Settings */}
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-brand-pink/10 backdrop-blur-sm z-20"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl p-8 z-30 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-brand-pink flex items-center gap-2">
                    <Settings /> Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X />
                  </button>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Model</label>
                    <select 
                      value={settings.model}
                      onChange={(e) => setSettings({...settings, model: e.target.value})}
                      className="w-full p-3 bg-white border-2 border-brand-mint rounded-2xl focus:outline-none font-medium"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Brainy)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temperature</label>
                      <span className="text-xs font-bold text-brand-pink">{settings.temperature}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-brand-pink"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                      <span>Strict</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Response Length</label>
                    <input 
                      type="number"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                      className="w-full p-3 bg-white border-2 border-brand-mint rounded-2xl focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                   <p className="text-[10px] text-gray-400 text-center font-medium">
                     Made with ❤️ for a lovely user
                   </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFB7C5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FF9AA2;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
