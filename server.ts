import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body; // base64 image data (without prefix)
      const { mimeType } = req.body;

      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const prompt = `
        Analyze this image for construction or safety helmet compliance.
        Identify all people and determine if they are wearing safety helmets (hard hats or motorcycle helmets).
        
        Return a JSON object with:
        - "detections": an array of objects, each containing:
          - "box_2d": [ymin, xmin, ymax, xmax] (normalized 0-1000)
          - "label": either "helmet" or "no_helmet"
          - "confidence": a number between 0 and 1 representing the confidence score
        - "summary": 
          - "compliant": total number of people wearing helmets
          - "violations": total number of people NOT wearing helmets
          - "status": "SAFE" if violations == 0, "WARNING" if violations > 0, "CRITICAL" if more violations than compliant.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: image,
                mimeType: mimeType
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    box_2d: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                      description: "[ymin, xmin, ymax, xmax]"
                    },
                    label: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["box_2d", "label", "confidence"]
                }
              },
              summary: {
                type: Type.OBJECT,
                properties: {
                  compliant: { type: Type.NUMBER },
                  violations: { type: Type.NUMBER },
                  status: { type: Type.STRING }
                },
                required: ["compliant", "violations", "status"]
              }
            },
            required: ["detections", "summary"]
          }
        }
      });

      const analysisRaw = response.text;
      const analysis = JSON.parse(analysisRaw);
      res.json(analysis);

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
