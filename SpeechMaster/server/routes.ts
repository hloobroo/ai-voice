import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversionSchema } from "@shared/schema";
import { generateSpeech, chunkText } from "./services/openai";
import { AudioProcessor } from "./services/audio";
import { randomUUID } from "crypto";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const audioProcessor = new AudioProcessor();

  // Create a new TTS conversion
  app.post("/api/conversions", async (req, res) => {
    try {
      const validatedData = insertConversionSchema.parse(req.body);
      
      if (!validatedData.text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      const conversion = await storage.createConversion(validatedData);
      
      // Start processing in background
      processConversion(conversion.id, validatedData, audioProcessor).catch(console.error);
      
      res.json({ id: conversion.id, status: "processing" });
    } catch (error) {
      console.error("Error creating conversion:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request data" });
    }
  });

  // Get conversion status and result
  app.get("/api/conversions/:id", async (req, res) => {
    try {
      const conversion = await storage.getConversion(req.params.id);
      
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      res.json(conversion);
    } catch (error) {
      console.error("Error fetching conversion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent conversions
  app.get("/api/conversions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const conversions = await storage.getRecentConversions(limit);
      res.json(conversions);
    } catch (error) {
      console.error("Error fetching conversions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Download audio file
  app.get("/api/audio/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'audio', filename);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processConversion(
  conversionId: string,
  data: { text: string; voice: string; speed: string; format: string },
  audioProcessor: AudioProcessor
) {
  try {
    await storage.updateConversion(conversionId, { status: "processing" });

    // Chunk the text
    const chunks = chunkText(data.text);
    console.log(`Processing ${chunks.length} chunks for conversion ${conversionId}`);

    const segments = [];
    const audioBuffers: Buffer[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      try {
        const audioBuffer = await generateSpeech(chunk, {
          voice: data.voice as any,
          speed: parseFloat(data.speed),
          format: data.format as any,
        });

        audioBuffers.push(audioBuffer);
        segments.push({
          index: i,
          text: chunk,
          wordCount: chunk.split(' ').length,
          status: "completed",
          processingTime: Date.now(), // Simplified timing
        });

        // Update progress
        await storage.updateConversion(conversionId, {
          segments,
          status: "processing",
        });
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        segments.push({
          index: i,
          text: chunk,
          wordCount: chunk.split(' ').length,
          status: "failed",
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Combine audio files
    console.log(`Combining ${audioBuffers.length} audio buffers`);
    const { buffer: combinedBuffer, duration, size } = await audioProcessor.combineAudioFiles(audioBuffers, data.format);

    // Save the combined audio file
    const filename = `${conversionId}.${data.format}`;
    const audioPath = await audioProcessor.saveAudioFile(combinedBuffer, filename);

    // Update conversion with final result
    await storage.updateConversion(conversionId, {
      audioPath,
      duration,
      fileSize: size,
      segments,
      status: "completed",
      completedAt: new Date(),
    });

    console.log(`Conversion ${conversionId} completed successfully`);
  } catch (error) {
    console.error(`Error processing conversion ${conversionId}:`, error);
    await storage.updateConversion(conversionId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}
