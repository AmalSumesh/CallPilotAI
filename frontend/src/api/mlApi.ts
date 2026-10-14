import { ML_BASE_URL, ApiError } from './client';
import type { MLAnalysisResponse, MLHealthResponse } from '../types';

export const mlApi = {
  checkHealth: async (): Promise<MLHealthResponse> => {
    try {
      const response = await fetch(`${ML_BASE_URL}/health`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`ML Service returned status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new ApiError(
        (error as Error).message || 'ML Service unreachable',
        0
      );
    }
  },

  analyzeAudio: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MLAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    // Using XMLHttpRequest when progress tracking is needed
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${ML_BASE_URL}/api/audio/analyze`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              reject(new ApiError('Failed to parse ML response', xhr.status));
            }
          } else {
            let errorMsg = 'Failed to analyze audio';
            try {
              const err = JSON.parse(xhr.responseText);
              if (err.detail) errorMsg = err.detail;
            } catch {
              // ignore
            }
            reject(new ApiError(errorMsg, xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(new ApiError('Network error connecting to ML Service', 0));
        };

        xhr.send(formData);
      });
    }

    const response = await fetch(`${ML_BASE_URL}/api/audio/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Failed to analyze audio';
      try {
        const errorData = await response.json();
        if (errorData.detail) errorMsg = errorData.detail;
      } catch {
        // ignore
      }
      throw new ApiError(errorMsg, response.status);
    }

    return await response.json();
  },
};
