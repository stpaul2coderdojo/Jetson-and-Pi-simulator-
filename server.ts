import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

// Gemini Chatbot Endpoint for Jupyter Notebook IDE
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, notebookContext, activeCellCode, targetHardware } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment. Please configure GEMINI_API_KEY in Settings > Secrets or .env.',
      });
    }

    const hardwareName =
      targetHardware === 'orin-nano'
        ? 'NVIDIA Jetson Orin Nano (40 TOPS, Ampere Architecture, CUDA 12.2, TensorRT 8.6, 8GB unified LPDDR5)'
        : targetHardware === 'pi-5'
        ? 'Raspberry Pi 5 (ARM Cortex-A76 quad-core 2.4GHz, ARM NEON SIMD, VideoCore VII, 8GB LPDDR4X)'
        : 'NVIDIA Thor Nano (250 TOPS, Blackwell Architecture, FP8 Tensor Cores, NVLink-C2C, 16GB unified)';

    const systemInstruction = `You are the EdgeDocker Sim Jupyter AI Assistant, a world-class edge computing and AI engineer specializing in ARM64 hardware, PyTorch, CUDA, TensorRT, ONNX Runtime, and containerized edge workloads.

You are embedded directly inside an interactive Jupyter Notebook IDE.
Active Target Hardware: ${hardwareName}

Your duties:
1. Help the user write, debug, and optimize Python code for edge execution.
2. Explain PyTorch tensor shapes, memory footprints (VRAM vs system RAM), and GPU vs CPU bottlenecks.
3. Provide optimization recipes: INT8/FP8 quantization, TensorRT graph optimization, torch.compile with TensorRT backend, ONNX dynamic axes, and memory-efficient batching.
4. Assist with Wildlife AI models (MegaDetector v5, Microsoft SPARROW acoustic spectrogram analysis, YOLOv8/v11-OBB) and NVIDIA edge workshops.
5. Provide executable Python code blocks (\`\`\`python ... \`\`\`) that can be directly inserted into the user's notebook. Keep explanations clear, rigorous, and concise.

${notebookContext ? `Current Notebook Context:\n${notebookContext}\n` : ''}
${activeCellCode ? `Active Cell Code:\n\`\`\`python\n${activeCellCode}\n\`\`\`\n` : ''}`;

    // Map conversation history to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      text: response.text || 'No response returned from Gemini.',
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: error.message || 'An internal error occurred while communicating with Gemini.',
    });
  }
});

// Start server with Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EdgeDocker Sim Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
