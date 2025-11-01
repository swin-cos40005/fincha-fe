import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

// Re-export formatValue from nodes/utils to maintain backward compatibility
export { formatValue } from './nodes/utils';

// Error handling utilities
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown, operation: string): ErrorResponse {
  const errorMsg = error instanceof Error ? error.message : String(error);
  return {
    success: false,
    error: errorMsg,
    message: `❌ **${operation} failed:** ${errorMsg}`,
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  message: string,
  data?: T
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Safely executes an async function and returns a standardized response
 */
export async function safeExecute<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<SuccessResponse<T> | ErrorResponse> {
  try {
    const result = await fn();
    return createSuccessResponse(`✅ **${operation} completed successfully**`, result);
  } catch (error) {
    return createErrorResponse(error, operation);
  }
}

/**
 * Validates required parameters and returns error response if missing
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredParams: string[],
  operation: string
): ErrorResponse | null {
  const missingParams = requiredParams.filter(param => !params[param]);
  
  if (missingParams.length > 0) {
    return createErrorResponse(
      new Error(`Missing required parameters: ${missingParams.join(', ')}`),
      operation
    );
  }
  
  return null;
}

/**
 * Handles common fetch errors with standardized responses
 */
export async function handleFetchResponse(
  response: Response,
): Promise<any> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error || errorData.message) {
        errorMessage = errorData.error || errorData.message;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Logs errors with consistent formatting
 */
export function logError(context: string, error: unknown, additionalInfo?: Record<string, any>): void {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`❌ [${context}] Error:`, errorMsg, {
    stack: errorStack,
    ...additionalInfo,
  });
}

/**
 * Logs warnings with consistent formatting
 */
export function logWarning(context: string, message: string, additionalInfo?: Record<string, any>): void {
  console.warn(`⚠️ [${context}] ${message}`, additionalInfo);
}
/**
 * Logs success messages with consistent formatting
 */
export function logSuccess(context: string, message: string, additionalInfo?: Record<string, any>): void {
  console.log(`✅ [${context}] ${message}`, additionalInfo);
}

