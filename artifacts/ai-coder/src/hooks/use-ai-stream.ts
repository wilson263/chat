import { useState, useCallback, useRef } from 'react';

export type ModelInfo = {
  model: string;
  intent: 'build_app' | 'fix_code' | 'explain_code' | 'reasoning' | 'general';
  autoSelected: boolean;
};

type StreamOptions = {
  onChunk?: (chunk: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: Error) => void;
  onModelInfo?: (info: ModelInfo) => void;
};

export function useAiStream(endpoint: string = 'chat/message') {
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const stream = useCallback(async (body: Record<string, any>, options?: StreamOptions) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setLoading(true);
    setContent('');
    setError(null);
    setModelInfo(null);
    let fullText = '';

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr.trim() === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) break;

              // Handle model routing info from the backend
              if (data.modelInfo) {
                const info = data.modelInfo as ModelInfo;
                setModelInfo(info);
                options?.onModelInfo?.(info);
                continue;
              }

              if (data.content) {
                fullText += data.content;
                setContent(prev => prev + data.content);
                options?.onChunk?.(data.content);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      options?.onFinish?.(fullText);
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        options?.onFinish?.(fullText);
        return;
      }
      const e = err instanceof Error ? err : new Error('Unknown streaming error');
      setError(e);
      options?.onError?.(e);
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      setLoading(false);
    }
  }, [endpoint]);

  return { stream, stop, isStreaming, loading, content, error, setContent, modelInfo };
}
