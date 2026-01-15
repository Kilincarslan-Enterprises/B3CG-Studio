import { supabase } from './supabase';
import type { VideoAnalysis, ChatMessage } from '../types';

export async function createVideoAnalysis(
  fileName: string,
  fileSize: number,
  duration?: number
): Promise<{ data: VideoAnalysis | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('video_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        duration,
        status: 'uploading',
        chat_history: [],
      })
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: new Error('Failed to create video analysis record') };
    }

    return { data: data as VideoAnalysis, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function uploadVideoToStorage(
  file: File,
  videoId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { url: null, error: new Error('User not authenticated') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${videoId}.${fileExt}`;
    const filePath = `B3CG/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function updateVideoAnalysisUrl(
  videoId: string,
  videoUrl: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('video_analyses')
      .update({
        video_url: videoUrl,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function triggerVideoAnalysis(
  videoId: string,
  fileName: string,
  fileSize: number
): Promise<{ error: Error | null }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('[triggerVideoAnalysis] Starting analysis trigger', {
      videoId,
      fileName,
      fileSize,
      endpoint: `${supabaseUrl}/functions/v1/analyze-video`,
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        videoId,
        fileName,
        fileSize,
      }),
    });

    console.log('[triggerVideoAnalysis] Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[triggerVideoAnalysis] Error response:', responseText);
      let errorMessage = 'Failed to trigger analysis';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return { error: new Error(errorMessage) };
    }

    const data = await response.json();
    console.log('[triggerVideoAnalysis] Success:', data);

    return { error: null };
  } catch (error) {
    console.error('[triggerVideoAnalysis] Exception:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function getVideoAnalysis(
  videoId: string
): Promise<{ data: VideoAnalysis | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as VideoAnalysis | null, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function sendChatMessage(
  videoId: string,
  question: string,
  analysisData: any,
  chatHistory: ChatMessage[]
): Promise<{ response: string | null; error: Error | null }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('[sendChatMessage] Sending chat message', {
      videoId,
      questionLength: question.length,
      endpoint: `${supabaseUrl}/functions/v1/ask-about-video`,
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/ask-about-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        videoId,
        question,
        analysisData,
        chatHistory,
      }),
    });

    console.log('[sendChatMessage] Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[sendChatMessage] Error response:', responseText);
      let errorMessage = 'Failed to send message';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return { response: null, error: new Error(errorMessage) };
    }

    const data = await response.json();
    console.log('[sendChatMessage] Success, response length:', data.response?.length || 0);
    return { response: data.response, error: null };
  } catch (error) {
    console.error('[sendChatMessage] Exception:', error);
    return {
      response: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function updateChatHistory(
  videoId: string,
  chatHistory: ChatMessage[]
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('video_analyses')
      .update({
        chat_history: chatHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function getUserVideoAnalyses(): Promise<{
  data: VideoAnalysis[] | null;
  error: Error | null
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as VideoAnalysis[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export async function deleteVideoAnalysis(videoId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('video_analyses')
      .delete()
      .eq('id', videoId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
