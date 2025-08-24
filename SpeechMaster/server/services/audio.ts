import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class AudioProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async combineAudioFiles(audioBuffers: Buffer[], format = 'mp3'): Promise<{ buffer: Buffer; duration: number; size: number }> {
    if (audioBuffers.length === 0) {
      throw new Error('No audio buffers provided');
    }

    if (audioBuffers.length === 1) {
      const buffer = audioBuffers[0];
      const duration = await this.getAudioDuration(buffer);
      return { buffer, duration, size: buffer.length };
    }

    // If FFmpeg is not available, concatenate buffers directly (basic approach)
    try {
      const combinedBuffer = await this.combineWithFFmpeg(audioBuffers, format);
      const duration = await this.getAudioDuration(combinedBuffer);
      return { buffer: combinedBuffer, duration, size: combinedBuffer.length };
    } catch (error) {
      console.warn('FFmpeg not available, using simple concatenation:', error instanceof Error ? error.message : 'Unknown error');
      // Fallback: simple buffer concatenation (may not work perfectly for all formats)
      const combinedBuffer = Buffer.concat(audioBuffers);
      const estimatedDuration = audioBuffers.length * 30; // Rough estimate
      return { buffer: combinedBuffer, duration: estimatedDuration, size: combinedBuffer.length };
    }
  }

  private async combineWithFFmpeg(audioBuffers: Buffer[], format: string): Promise<Buffer> {
    const tempFiles: string[] = [];
    const outputFile = path.join(this.tempDir, `combined_${randomUUID()}.${format}`);
    const listFile = path.join(this.tempDir, `filelist_${randomUUID()}.txt`);

    try {
      // Write audio buffers to temporary files
      for (let i = 0; i < audioBuffers.length; i++) {
        const tempFile = path.join(this.tempDir, `temp_${randomUUID()}_${i}.${format}`);
        await fs.writeFile(tempFile, audioBuffers[i]);
        tempFiles.push(tempFile);
      }

      // Create file list for FFmpeg
      const fileList = tempFiles.map(file => `file '${file}'`).join('\n');
      await fs.writeFile(listFile, fileList);

      // Run FFmpeg to concatenate files
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-f', 'concat',
          '-safe', '0',
          '-i', listFile,
          '-c', 'copy',
          '-y',
          outputFile
        ]);

        ffmpeg.stderr.on('data', (data) => {
          console.log(`FFmpeg: ${data}`);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });

        ffmpeg.on('error', reject);
      });

      // Read the combined file
      const combinedBuffer = await fs.readFile(outputFile);
      return combinedBuffer;

    } finally {
      // Clean up temporary files
      const allTempFiles = [...tempFiles, listFile, outputFile];
      for (const file of allTempFiles) {
        try {
          await fs.unlink(file);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }

  private async getAudioDuration(audioBuffer: Buffer): Promise<number> {
    // This is a simplified approach - in a real implementation, you'd use
    // a library like 'node-ffprobe' or 'music-metadata' to get accurate duration
    const tempFile = path.join(this.tempDir, `duration_${randomUUID()}.mp3`);
    
    try {
      await fs.writeFile(tempFile, audioBuffer);
      
      return new Promise<number>((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          tempFile
        ]);

        let output = '';
        ffprobe.stdout.on('data', (data) => {
          output += data.toString();
        });

        ffprobe.on('close', (code) => {
          if (code === 0) {
            const duration = parseFloat(output.trim());
            resolve(isNaN(duration) ? 30 : Math.round(duration)); // Default to 30 seconds if parsing fails
          } else {
            resolve(30); // Fallback duration
          }
        });

        ffprobe.on('error', () => {
          resolve(30); // Fallback duration if ffprobe fails
        });
      });
    } catch (error) {
      return 30; // Fallback duration
    } finally {
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        // Ignore cleanup error
      }
    }
  }

  async saveAudioFile(buffer: Buffer, filename: string): Promise<string> {
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    await fs.mkdir(audioDir, { recursive: true });
    
    const filePath = path.join(audioDir, filename);
    await fs.writeFile(filePath, buffer);
    
    return `/audio/${filename}`;
  }
}
