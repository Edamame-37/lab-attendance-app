// src/services/aiService.js

// Ganti URL di bawah dengan endpoint API AI resmi dari pengajar/dosen (dapat dikonfigurasi via EXPO_PUBLIC_AI_API_URL)
const AI_API_URL =
  process.env.EXPO_PUBLIC_AI_API_URL ||
  'https://api-ai-praktikum.example.com/classify';
const TIMEOUT_MS = 6000;

export const classifyLeaveReason = async (reasonText) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: reasonText }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      category: data.category || 'Lainnya',
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
      isFallback: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[aiService] Gagal memanggil API AI, menggunakan fallback:', error.message);

    // Fail-safe agar praktikan tetap bisa submit izin meskipun server AI bermasalah
    return {
      category: 'Perlu Verifikasi Manual',
      confidence: null,
      isFallback: true,
    };
  }
};
