import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onStop?: () => void
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 rounded-3xl shadow-lg shadow-gray-900/5 dark:shadow-black/20 focus-within:border-blue-300 dark:focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/20 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-black/30">
            
            {/* Input Area */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Assistant..."
              className="min-h-[56px] max-h-[120px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-base px-6 py-4 pr-16 placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium"
              disabled={isLoading}
            />
            
            {/* Send Button */}
            <div className="absolute right-3 bottom-3">
              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onStop}
                  className="h-10 w-10 p-0 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 ring-2 ring-gray-200 dark:ring-gray-700"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className={`h-10 w-10 p-0 rounded-2xl transition-all duration-300 ${
                    input.trim() 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 ring-2 ring-blue-200/50 dark:ring-blue-800/50' 
                      : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-400 dark:text-gray-500 cursor-not-allowed ring-2 ring-gray-200/50 dark:ring-gray-700/50'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
        
        {/* Subtle hint text */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}