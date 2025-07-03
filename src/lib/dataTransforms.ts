/**
 * Data transformation utilities for converting between database schema (snake_case)
 * and frontend interfaces (camelCase) with proper validation and error handling
 */

import { Conversation, Message } from '@/types/chat'

/**
 * Database record types (snake_case as they come from the database)
 */
export interface DbConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DbMessage {
  id: string
  conversation_id: string
  user_id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string | null
}

/**
 * Safely parse a date string, returning null if invalid
 */
function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    console.warn('Date string is null or undefined')
    return null
  }
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`)
      return null
    }
    return date
  } catch (error) {
    console.error(`Failed to parse date string: ${dateString}`, error)
    return null
  }
}

/**
 * Safely parse JSON string, returning fallback if invalid
 */
function parseJsonSafely<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) {
    return fallback
  }
  
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn(`Failed to parse JSON: ${jsonString}`, error)
    return fallback
  }
}

/**
 * Transform database conversation record to frontend interface
 */
export function transformDbConversation(dbConversation: DbConversation): Conversation | null {
  console.log('🔄 Transforming database conversation:', dbConversation)
  
  try {
    // Validate required fields
    if (!dbConversation.id || !dbConversation.title) {
      console.error('❌ Invalid conversation record - missing required fields:', dbConversation)
      return null
    }

    const createdAt = parseDate(dbConversation.created_at)
    const updatedAt = parseDate(dbConversation.updated_at)
    
    console.log('📅 Parsed dates:', { 
      created_at: dbConversation.created_at, 
      updated_at: dbConversation.updated_at,
      parsedCreatedAt: createdAt,
      parsedUpdatedAt: updatedAt
    })

    // Use current date as fallback if dates are invalid
    const now = new Date()
    
    const transformed = {
      id: dbConversation.id,
      title: dbConversation.title,
      messages: [], // Messages are loaded separately
      createdAt: createdAt || now,
      updatedAt: updatedAt || now
    }
    
    console.log('✅ Successfully transformed conversation:', transformed)
    return transformed
  } catch (error) {
    console.error('❌ Failed to transform conversation record:', dbConversation, error)
    return null
  }
}

/**
 * Transform database message record to frontend interface
 */
export function transformDbMessage(dbMessage: DbMessage): Message | null {
  console.log('🔄 Transforming database message:', dbMessage)
  
  try {
    // Validate required fields
    if (!dbMessage.id || !dbMessage.content || !dbMessage.type) {
      console.error('❌ Invalid message record - missing required fields:', dbMessage)
      return null
    }

    // Validate message type
    if (dbMessage.type !== 'user' && dbMessage.type !== 'assistant') {
      console.error('❌ Invalid message type:', dbMessage.type)
      return null
    }

    const timestamp = parseDate(dbMessage.timestamp)
    if (!timestamp) {
      console.error('❌ Invalid timestamp for message:', dbMessage.id, dbMessage.timestamp)
      return null
    }

    // Parse sources if available
    const sources = parseJsonSafely<string[]>(dbMessage.sources, [])
    console.log('🔗 Parsed sources:', { raw: dbMessage.sources, parsed: sources })

    const transformed = {
      id: dbMessage.id,
      type: dbMessage.type,
      content: dbMessage.content,
      timestamp,
      sources: sources.length > 0 ? sources : undefined
    }
    
    console.log('✅ Successfully transformed message:', {
      id: transformed.id,
      type: transformed.type,
      contentLength: transformed.content.length,
      timestamp: transformed.timestamp,
      hasSources: !!transformed.sources
    })
    
    return transformed
  } catch (error) {
    console.error('❌ Failed to transform message record:', dbMessage, error)
    return null
  }
}

/**
 * Transform multiple database conversations with error handling
 */
export function transformDbConversations(dbConversations: DbConversation[]): Conversation[] {
  console.log(`🔄 Transforming ${dbConversations.length} database conversations...`)
  
  const transformedConversations: Conversation[] = []
  
  for (const dbConvo of dbConversations) {
    const transformed = transformDbConversation(dbConvo)
    if (transformed) {
      transformedConversations.push(transformed)
    }
  }
  
  console.log(`✅ Successfully transformed ${transformedConversations.length} of ${dbConversations.length} conversations`)
  return transformedConversations
}

/**
 * Transform multiple database messages with error handling
 */
export function transformDbMessages(dbMessages: DbMessage[]): Message[] {
  console.log(`🔄 Transforming ${dbMessages.length} database messages...`)
  
  const transformedMessages: Message[] = []
  
  for (const dbMessage of dbMessages) {
    const transformed = transformDbMessage(dbMessage)
    if (transformed) {
      transformedMessages.push(transformed)
    }
  }
  
  console.log(`✅ Successfully transformed ${transformedMessages.length} of ${dbMessages.length} messages`)
  return transformedMessages
}

/**
 * Create a database conversation record from frontend data
 */
export function createDbConversation(
  id: string,
  userId: string,
  title: string
): Omit<DbConversation, 'created_at' | 'updated_at'> {
  const dbRecord = {
    id,
    user_id: userId,
    title
  }
  
  console.log('📤 Creating database conversation record:', dbRecord)
  return dbRecord
}

/**
 * Create a database message record from frontend data
 */
export function createDbMessage(
  message: Message,
  conversationId: string,
  userId: string
): Omit<DbMessage, 'created_at'> {
  const sourcesJson = message.sources && message.sources.length > 0 
    ? JSON.stringify(message.sources) 
    : null
    
  const dbRecord = {
    id: message.id,
    conversation_id: conversationId,
    user_id: userId,
    type: message.type,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    sources: sourcesJson
  }
  
  console.log('📤 Creating database message record:', {
    id: dbRecord.id,
    conversation_id: dbRecord.conversation_id,
    type: dbRecord.type,
    contentLength: dbRecord.content.length,
    timestamp: dbRecord.timestamp,
    hasSources: !!dbRecord.sources
  })
  
  return dbRecord
}