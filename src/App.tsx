import { useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationSidebar } from '@/components/ConversationSidebar'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { useChat } from '@/hooks/useChat'
import { Sparkles } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    startNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    initialized
  } = useChat()

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    const scrollToBottom = () => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
    
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [currentConversation?.messages])

  useEffect(() => {
    const scrollToBottom = () => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollArea) {
        // Check if user is near bottom before auto-scrolling
        const isNearBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 100
        if (isNearBottom) {
          scrollArea.scrollTo({
            top: scrollArea.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }
    
    // More frequent scrolling during streaming for better UX
    const timer = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timer)
  }, [currentConversation?.messages?.map(m => m.content).join('')])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading conversations...</p>
        </div>
      </div>
    )
  }

  const welcomeMessage = (
    <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 dark:from-gray-900/50 dark:via-gray-900 dark:to-blue-950/20">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          How can I help you today?
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
          I can search the web and provide comprehensive answers to your questions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {[
            "What's happening in tech today?",
            "Explain quantum computing",
            "Best restaurants nearby",
            "Latest weather forecast"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => sendMessage(suggestion)}
              className="group p-5 text-left bg-white/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 backdrop-blur-sm"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 font-medium">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={startNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />
      
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {/* Chat Area */}
        {currentConversation && currentConversation.messages.length > 0 ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto px-4 py-6">
                {currentConversation.messages.map((message) => (
                  <div key={message.id} className="mb-6">
                    <ChatMessage message={message} />
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Input */}
            <div className="border-t border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                onStop={stopGeneration}
              />
            </div>
          </>
        ) : (
          <>
            {welcomeMessage}
            <div className="border-t border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                onStop={stopGeneration}
              />
            </div>
          </>
        )}
        <Toaster />
      </div>
    </div>
  )
}

export default App