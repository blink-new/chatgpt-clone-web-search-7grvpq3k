import { useState, useRef, useEffect } from 'react'
import { blink } from '@/blink/client'
import { Message, Conversation } from '@/types/chat'
import { toast } from '@/hooks/use-toast'
import { 
  transformDbConversations, 
  transformDbMessages, 
  createDbConversation, 
  createDbMessage,
  type DbConversation,
  type DbMessage
} from '@/lib/dataTransforms'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const MAX_CONTEXT_MESSAGES = 20

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const abortControllerRef = useRef<AbortController>()
  const [initialized, setInitialized] = useState(false)

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  // Check authentication status and load conversations if authenticated
  useEffect(() => {
    if (initialized) return
    
    const initializeChat = async () => {
      try {
        // Check if user is authenticated
        try {
          const authUser = await blink.auth.me()
          console.log('🔐 User authenticated:', authUser)
          setUser(authUser)
          setIsAuthenticated(true)
          
          // Load conversations from database with proper transformation
          try {
            console.log('📊 Querying conversations from database...')
            const dbConvos = await blink.db.conversations.list({
              where: { user_id: authUser.id },
              orderBy: { updated_at: 'desc' },
              limit: 20
            }) as DbConversation[]
            
            console.log('📋 Database conversations response (fixed SDK):', {
              count: dbConvos.length,
              data: dbConvos
            })
            
            // Transform conversations with validation
            const transformedConvos = transformDbConversations(dbConvos)
            console.log('🔄 Transformed conversations:', transformedConvos)
            
            // Load messages for each conversation
            const convosWithMessages: Conversation[] = []
            for (const convo of transformedConvos) {
              try {
                console.log(`💬 Querying messages for conversation ${convo.id}...`)
                const dbMessages = await blink.db.messages.list({
                  where: { conversation_id: convo.id },
                  orderBy: { timestamp: 'asc' },
                  limit: 100
                }) as DbMessage[]
                
                console.log(`📝 Messages for conversation ${convo.id} (fixed SDK):`, {
                  count: dbMessages.length,
                  data: dbMessages
                })
                
                // Transform messages with validation
                const transformedMessages = transformDbMessages(dbMessages)
                console.log(`🔄 Transformed messages for conversation ${convo.id}:`, transformedMessages)
                
                convosWithMessages.push({
                  ...convo,
                  messages: transformedMessages
                })
              } catch (error) {
                console.error(`❌ Failed to load messages for conversation ${convo.id}:`, error)
                // Include conversation without messages rather than failing completely
                convosWithMessages.push({
                  ...convo,
                  messages: []
                })
              }
            }
            
            console.log('✅ Final transformed conversations with messages:', {
              count: convosWithMessages.length,
              data: convosWithMessages
            })
            setConversations(convosWithMessages)
            setCurrentConversationId(convosWithMessages[0]?.id)
          } catch (error) {
            console.error('❌ Failed to load conversations from database:', error)
            // Set empty state but don't crash
            setConversations([])
            setCurrentConversationId(undefined)
          }
        } catch {
          // Authentication failed - this is expected behavior with authRequired: true
          // Blink will automatically redirect to login page
          console.log('🔒 Authentication required - will redirect to login')
          setUser(null)
          setIsAuthenticated(false)
          setConversations([])
          setCurrentConversationId(undefined)
        }
      } catch (error) {
        console.error('❌ Failed to initialize chat:', error)
        // Set empty state and continue
        setConversations([])
        setCurrentConversationId(undefined)
      } finally {
        setInitialized(true)
      }
    }
    
    initializeChat()
  }, [initialized])

  // Create and persist a new conversation (if authenticated)
  const createNewConversation = async (): Promise<Conversation> => {
    const id = generateId()
    const title = 'New Chat'
    const now = new Date()
    
    if (isAuthenticated && user) {
      try {
        console.log('💾 Creating new conversation in database...')
        const dbConvoData = createDbConversation(id, user.id, title)
        console.log('📤 Conversation data to save:', dbConvoData)
        
        const convo = await blink.db.conversations.create(dbConvoData) as DbConversation
        
        console.log('✅ Created conversation in DB:', convo)
        
        return {
          id: convo.id,
          title: convo.title,
          messages: [],
          createdAt: new Date(convo.created_at),
          updatedAt: new Date(convo.updated_at)
        }
      } catch (error) {
        console.error('❌ Failed to create conversation in DB:', error)
        toast({
          title: "Warning",
          description: "Failed to save conversation to database. Working in offline mode.",
          variant: "destructive"
        })
        // Fall back to local-only conversation
      }
    }
    
    // Local-only conversation (for unauthenticated users or DB errors)
    console.log('📝 Creating local-only conversation (offline mode)')
    return {
      id,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now
    }
  }

  // Start a new conversation
  const startNewConversation = async () => {
    const newConversation = await createNewConversation()
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
  }

  // Select a conversation
  const selectConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  // Delete a conversation (and its messages)
  const deleteConversation = async (id: string) => {
    try {
      if (isAuthenticated && user) {
        console.log(`🗑️ Deleting conversation ${id} and its messages from database...`)
        
        // Delete from database (fixed SDK - returns array directly)
        const messages = await blink.db.messages.list({
          where: { conversation_id: id }
        }) as DbMessage[]
        
        console.log(`📋 Found ${messages.length} messages to delete for conversation ${id}`)
        
        // Delete each message individually
        for (const message of messages) {
          console.log(`💬 Deleting message ${message.id}...`)
          await blink.db.messages.delete(message.id)
        }
        
        // Delete the conversation
        console.log(`🗂️ Deleting conversation ${id}...`)
        await blink.db.conversations.delete(id)
        console.log('✅ Successfully deleted conversation and messages from database')
      }
      
      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== id))
      if (currentConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id)
        setCurrentConversationId(remaining[0]?.id)
      }
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      })
    }
  }

  // Update conversation title in DB and state
  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage
    
    console.log(`📝 Updating conversation ${conversationId} title to: "${title}"`)
    
    if (isAuthenticated && user) {
      try {
        console.log(`💾 Saving title update to database...`)
        await blink.db.conversations.update(conversationId, { title })
        console.log('✅ Successfully updated conversation title in database')
      } catch (error) {
        console.error('❌ Failed to update conversation title in DB:', error)
      }
    }
    
    // Update local state
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId 
          ? { ...c, title, updatedAt: new Date() }
          : c
      )
    )
  }

  // Add message to DB and state
  const addMessage = async (conversationId: string, message: Message) => {
    console.log(`💬 Adding message to conversation ${conversationId}:`, {
      messageId: message.id,
      type: message.type,
      contentLength: message.content.length,
      hasContent: !!message.content
    })
    
    if (isAuthenticated && user) {
      try {
        console.log('💾 Saving message to database...')
        const dbMessageData = createDbMessage(message, conversationId, user.id)
        console.log('📤 Message data to save:', dbMessageData)
        
        await blink.db.messages.create(dbMessageData)
        console.log('✅ Saved message to DB:', message.id)
      } catch (error) {
        console.error('❌ Failed to save message to DB:', error)
        toast({
          title: "Warning",
          description: "Failed to save message to database. Your conversation may not persist.",
          variant: "destructive"
        })
      }
    }
    
    // Update local state
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date() }
          : c
      )
    )
  }

  // Send message with streaming AI response
  const sendMessage = async (content: string) => {
    if (!content.trim()) return
    setIsLoading(true)
    let conversationId = currentConversationId
    let conversation = conversations.find(c => c.id === conversationId)
    
    try {
      // Create new conversation if none exists
      if (!conversationId || !conversation) {
        const newConversation = await createNewConversation()
        setConversations(prev => [newConversation, ...prev])
        conversationId = newConversation.id
        setCurrentConversationId(conversationId)
        conversation = newConversation
      }
      
      // Add user message
      const userMessage: Message = {
        id: generateId(),
        type: 'user',
        content,
        timestamp: new Date()
      }
      await addMessage(conversationId, userMessage)
      
      // Update title if this is the first message
      if (!conversation.messages.length) {
        await updateConversationTitle(conversationId, content)
      }
      
      // Add assistant message placeholder for streaming
      const assistantMessageId = generateId()
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true
      }
      
      // Add to local state immediately
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
            : c
        )
      )
      
      // Stream AI response
      let streamingText = ''
      
      // Get last MAX_CONTEXT_MESSAGES from conversation, append latest user message
      const contextMessages = (conversation.messages || [])
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      const messagesForAI = [
        ...contextMessages,
        { role: 'user', content }
      ]
      
      const result = await blink.ai.streamText(
        {
          messages: messagesForAI,
          search: true,
          model: 'gpt-4o-mini',
          maxTokens: 2000
        },
        (chunk) => {
          // Accumulate the streaming text
          streamingText += chunk
          
          // Update the message in real-time - this is the key fix
          setConversations(prev =>
            prev.map(c =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === assistantMessageId 
                        ? { ...m, content: streamingText, isLoading: true }
                        : m
                    ),
                    updatedAt: new Date()
                  }
                : c
            )
          )
        }
      )
      
      // Extract sources from the result if available
      const sources = result?.sources || []
      
      // Final update - mark as no longer loading and add sources
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMessageId 
                    ? { ...m, content: streamingText, isLoading: false, sources }
                    : m
                ),
                updatedAt: new Date()
              }
            : c
        )
      )
      
      // Save assistant message to DB (if authenticated)
      if (isAuthenticated && user) {
        try {
          console.log('💾 Saving final assistant message to database...')
          const finalAssistantMessage: Message = {
            id: assistantMessageId,
            type: 'assistant',
            content: streamingText,
            timestamp: new Date(),
            sources: sources.length > 0 ? sources : undefined
          }
          
          const dbMessageData = createDbMessage(finalAssistantMessage, conversationId, user.id)
          console.log('📤 Final assistant message data to save:', dbMessageData)
          
          await blink.db.messages.create(dbMessageData)
          console.log('✅ Saved assistant message to DB:', assistantMessageId)
        } catch (error) {
          console.error('❌ Failed to save assistant message to DB:', error)
          toast({
            title: "Warning",
            description: "Failed to save response to database.",
            variant: "destructive"
          })
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // If we have a conversation ID, update with error message
      if (conversationId) {
        const errorMessageId = generateId()
        const errorMessage: Message = {
          id: errorMessageId,
          type: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
          isLoading: false
        }
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, errorMessage], updatedAt: new Date() }
              : c
          )
        )
      }
      
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = undefined
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    startNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    initialized,
    isAuthenticated,
    user
  }
}