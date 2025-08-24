# Overview

This is a text-to-speech (TTS) conversion web application built with a React frontend and Express.js backend. The application allows users to convert text input into high-quality speech audio files using OpenAI's TTS API. Users can input text (up to 100,000 characters), select voice preferences, adjust playback speed, and download the generated audio as MP3 files. The system processes long texts by breaking them into segments and combining the audio output into a single file.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme Support**: Custom theme context with light/dark mode switching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for TTS conversion operations
- **Session Management**: In-memory storage with potential for database scaling
- **Audio Processing**: Custom AudioProcessor class with FFmpeg integration for combining audio segments
- **Text Processing**: Smart text chunking algorithm that respects sentence boundaries for natural speech

## Data Storage
- **Primary**: Drizzle ORM configured for PostgreSQL with schema-first approach
- **Current**: In-memory storage implementation (MemStorage class) for development
- **Schema**: User management and conversion tracking with metadata (duration, file size, segments)
- **Migration Support**: Drizzle-kit for database schema management

## External Dependencies
- **TTS Service**: OpenAI Audio API with support for multiple voices (alloy, echo, fable, onyx, nova, shimmer)
- **Audio Processing**: FFmpeg for combining multiple audio segments into single output files
- **Database**: PostgreSQL (configured via Neon Database serverless)
- **Development Tools**: Replit integration for cloud development environment

## Key Design Decisions

### Text Processing Strategy
- **Problem**: OpenAI TTS API has character limits per request
- **Solution**: Intelligent text chunking that splits on sentence boundaries while respecting 4000-character limits
- **Benefits**: Maintains natural speech flow and prevents awkward mid-sentence cuts

### Audio Combination Approach
- **Problem**: Multiple audio segments need seamless combination
- **Solution**: Custom AudioProcessor with FFmpeg integration and fallback concatenation
- **Benefits**: Professional audio quality with proper segment alignment

### Real-time Status Updates
- **Problem**: Long text processing requires user feedback
- **Solution**: Polling-based status updates with segment-level progress tracking
- **Benefits**: Users see detailed progress without websocket complexity

### Storage Architecture
- **Problem**: Need scalable data persistence
- **Solution**: Abstract storage interface with memory and database implementations
- **Benefits**: Easy transition from development to production without code changes