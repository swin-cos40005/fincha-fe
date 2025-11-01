// Note: This file is for server-side use only - do not import in client components
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProvider,
} from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Function to create provider with optional custom API key
export function createProvider(customApiKey?: string) {
  if (isTestEnvironment) {
    return customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    });
  }
  if (!customApiKey) {
    const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!envKey) {
      console.warn('WARNING: No API key found in environment variables');
    }
  }
  let google: GoogleGenerativeAIProvider;
  try {
    google = createGoogleGenerativeAI(
      customApiKey ? { apiKey: customApiKey } : undefined,
    );
  } catch (error) {
    console.error('Error creating Google provider:', error);
    throw error;
  }

  return customProvider({
    languageModels: {
      'chat-model': google('gemini-2.5-pro'),
      'chat-model-reasoning': wrapLanguageModel({
        model: google('gemini-2.5-pro'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': google('gemini-2.5-pro'),
      'artifact-model': google('gemini-2.5-pro'),
    },
  });
}

// Default provider using environment variables
export const myProvider = createProvider();
