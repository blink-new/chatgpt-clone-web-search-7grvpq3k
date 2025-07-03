import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Plus, MessageSquare, Trash2, Sparkles, PanelLeft } from "lucide-react"
import { Conversation } from "@/types/chat"
import { formatDistanceToNow } from "date-fns"

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

// Safe date formatting helper
function formatTimeSafely(date: Date): string {
  try {
    // Validate that it's actually a Date object and not null/undefined
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatTimeSafely:', date)
      return 'Unknown time'
    }
    
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', date, error)
    return 'Unknown time'
  }
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-50/80 dark:bg-gray-900/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 pb-4">
        <Button 
          onClick={() => {
            onNewConversation()
            setIsOpen(false)
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl h-12 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          New chat
        </Button>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 pb-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-14 h-14 bg-gray-200/80 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your conversations will appear here
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = currentConversationId === conversation.id
              return (
                <div key={conversation.id} className="group relative">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left h-auto p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                      isActive 
                        ? 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-700/50' 
                        : 'hover:bg-white/60 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      onSelectConversation(conversation.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <div className={`mt-1 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1.5 truncate leading-snug">
                          {conversation.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeSafely(conversation.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </Button>
                  
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conversation.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-t from-gray-50/90 to-transparent dark:from-gray-900/40">
        <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium">AI Assistant with Web Search</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="fixed top-4 left-4 z-50 h-11 w-11 p-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg rounded-xl hover:shadow-xl transition-all duration-200"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 border-r border-gray-200/60 dark:border-gray-700/60 bg-gray-50/40 dark:bg-gray-900/20">
        <SidebarContent />
      </div>
    </>
  )
}