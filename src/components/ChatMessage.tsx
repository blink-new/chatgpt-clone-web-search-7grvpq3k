import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, User, Bot, ExternalLink, CheckCheck } from "lucide-react"
import { Message } from "@/types/chat"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive"
      })
    }
  }

  const isUser = message.type === 'user'

  return (
    <div className={`group ${isUser ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={`text-sm font-medium ${
                isUser 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-blue-500 text-white'
              }`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Message Content (Markdown) */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {message.isLoading && !message.content ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  {message.isLoading && message.content && (
                    <div className="inline-flex items-center ml-1">
                      <div className="flex space-x-1">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sources */}
            {message.sources && message.sources.length > 0 && !message.isLoading && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sources ({message.sources.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-auto p-2 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-blue-200 dark:border-blue-700 rounded-md"
                      onClick={() => window.open(source, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            {!message.isLoading && (
              <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 px-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-3 w-3 mr-1.5 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}