import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Routes
  app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    try {
      // Simple DuckDuckGo HTML search scraping
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      const results: { title: string; link: string; snippet: string }[] = [];

      $('.result__body').each((i, el) => {
        if (i < 5) {
          const title = $(el).find('.result__a').text();
          const link = $(el).find('.result__a').attr('href') || '';
          const snippet = $(el).find('.result__snippet').text();
          if (title && link) {
            results.push({ title, link, snippet });
          }
        }
      });

      res.json({ results });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      // Basic text extraction
      $('script, style, nav, footer, header').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim();
      
      res.json({ content: content.substring(0, 5000) });
    } catch (error) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: 'Failed to scrape URL' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { messages, context, settings } = req.body;
    try {
      const prompt = `
Context information:
${context || 'No specific context provided.'}

Settings:
${JSON.stringify(settings || {})}

User history:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Role: You are a "Lovely AI Assistant". Your personality is super cute, helpful, and sweet. You use "kawaii" expressions and emojis often. You speak in Vietnamese unless requested otherwise.
Goal: Provide a concise and clear analysis or response based on the context and user query.
      `;

      const result = await ai.models.generateContent({
        model: settings.model || 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const responseText = result.text;
      res.json({ content: responseText });
    } catch (error) {
      console.error('AI error:', error);
      res.status(500).json({ error: 'AI processing failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
