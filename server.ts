import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

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

// Small Language Model (SLM) & Semantic Kernel Function rewrite() Endpoint
app.post('/api/tools/rewrite', async (req, res) => {
  try {
    const {
      text,
      wordLimit = 120,
      context = 'Executive & Technical Communication',
      tone = 'Professional & Concise',
      slmModel = 'Phi-3.5-mini-instruct (3.8B)',
      subsection = 'writing',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Input text is required for rewrite().' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Server Gemini API key not configured. Falling back to local SLM rewrite engine.',
      });
    }

    const numericLimit = Math.max(10, Math.min(2000, Number(wordLimit) || 120));

    const systemInstruction = `You are an enterprise Small Language Model (${slmModel}) orchestrated by Microsoft Semantic Kernel executing the native/semantic function \`rewrite(text, wordLimit, context)\`.

Active Subsection Mode: ${subsection === 'editing' ? 'Structural Editing & Precision Refinement' : 'Professional Writing & Composition'}
Target Context: ${context}
Target Tone: ${tone}
Strict Word Limit: Maximum ${numericLimit} words.

Your task:
1. Rewrite the user's input text so that it reads significantly more professionally, clearly, and authoritatively for the specified context (${context}).
2. Strictly enforce the word limit of at most ${numericLimit} words without losing core technical or business meaning.
3. Correct any awkward phrasing, passive voice, or spelling/grammar defects automatically during the rewrite.
4. Return a JSON object matching the required schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Execute function rewrite(text, wordLimit=${numericLimit}, context="${context}"):\n\nInput Text:\n"""\n${text}\n"""`,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: {
              type: Type.STRING,
              description: 'The professionally rewritten text strictly within the requested word limit.',
            },
            keyImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 concise bullet points explaining the stylistic and structural improvements made.',
            },
            toneAchieved: {
              type: Type.STRING,
              description: 'Short label of the resulting professional tone.',
            },
          },
          required: ['rewrittenText', 'keyImprovements', 'toneAchieved'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawJson);

    return res.json({
      rewrittenText: parsed.rewrittenText || text,
      keyImprovements: parsed.keyImprovements || [
        'Elevated vocabulary and professional register for target context',
        `Constrained length to fit within ${numericLimit}-word limit`,
      ],
      toneAchieved: parsed.toneAchieved || tone,
      slmModel,
      engine: 'gemini-3.1-flash-lite',
    });
  } catch (error: any) {
    console.error('Error in /api/tools/rewrite:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while executing rewrite().',
    });
  }
});

// Microsoft Semantic Kernel Spelling & Grammar Checker Endpoint
app.post('/api/tools/spellcheck', async (req, res) => {
  try {
    const { text, context = 'Professional Technical & Business Writing' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Input text is required for Semantic Kernel spell checking.' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Server Gemini API key not configured. Using local Semantic Kernel dictionary & grammar rules.',
      });
    }

    const systemInstruction = `You are a Microsoft Semantic Kernel Plugin (\`SpellCheckerPlugin.CheckSpellingAndGrammarAsync\`) integrated with a Small Language Model.
Analyze the provided text within the context of "${context}".
Identify all spelling mistakes, typographical errors, grammatical errors, punctuation issues, and unprofessional word choices.
Return both the list of specific issues and the fully corrected version of the text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Run Semantic Kernel SpellCheckerPlugin on the following text:\n\n"""\n${text}\n"""`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedText: {
              type: Type.STRING,
              description: 'The complete text with all spelling and grammar corrections applied.',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: {
                    type: Type.STRING,
                    description: 'The exact misspelled word or grammatically incorrect phrase from the original text.',
                  },
                  suggestion: {
                    type: Type.STRING,
                    description: 'The corrected replacement word or phrase.',
                  },
                  type: {
                    type: Type.STRING,
                    description: 'One of: spelling, grammar, style, punctuation',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Brief explanation of why this correction improves accuracy or professionalism.',
                  },
                },
                required: ['original', 'suggestion', 'type', 'explanation'],
              },
            },
            readabilityScore: {
              type: Type.NUMBER,
              description: 'Estimated professional clarity score from 0 to 100.',
            },
          },
          required: ['correctedText', 'issues', 'readabilityScore'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawJson);

    return res.json({
      correctedText: parsed.correctedText || text,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      readabilityScore: typeof parsed.readabilityScore === 'number' ? parsed.readabilityScore : 92,
      pluginName: 'Microsoft.SemanticKernel.Plugins.Writing.SpellCheckerPlugin',
    });
  } catch (error: any) {
    console.error('Error in /api/tools/spellcheck:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during Semantic Kernel spell check.',
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
