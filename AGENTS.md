# AGENTS.md

This file provides shared guidance for coding agents working in this repository, including Claude Code, Codex, and other compatible assistants.

## Development Commands

### Building the Project
The project uses Lerna for monorepo management with pnpm as the package manager.

```bash
# Build all packages for development
lerna run build-dev

# Build desktop app specifically for production
cd src/packages/desktop && pnpm run build-prod

# Build desktop app for development
cd src/packages/desktop && pnpm run build-dev

# Type checking (desktop)
cd src/packages/desktop && pnpm run check-types
```

### Testing
```bash
# Run tests for specific package (example: desktop)
cd src/packages/desktop && pnpm test

# Run tests for any package with Jest
cd src/packages/[package-name] && pnpm test
```

### Development Server
```bash
# Start desktop app in development mode
cd src/packages/desktop && pnpm start

# Start desktop app in live development mode
cd src/packages/desktop && pnpm live-start
```

### Build Process Details
- Type checking and type generation: `build-types` script
- TypeScript compilation: Uses esbuild for development builds
- Each package has a `build-dev` script that runs: `npm run build-types && npm run esbuild-dev`
- Lerna caches builds, so unchanged packages won't rebuild unnecessarily

## Architecture Overview

### Project Structure
This is a monorepo using Lerna and pnpm workspaces. The main application is an Electron desktop app with multiple supporting packages:

**Core Application:**
- `desktop` - Main Electron application (productivity/focus tracking tool)
- `models` - Shared data models and types
- `config` - Configuration management

**Services & Utilities:**
- `activmon` - User activity state machine monitoring
- `app-observer` - Application change tracking with Swift native components
- `recorder` - Screen and voice recording functionality
- `logger` - Centralized logging service
- `dal` - Data access layer with SQLite/Knex
- `utils` - Shared utility functions
- `pm` - Process management

**Data Processing:**
- `dhapp` - Data processing pipeline with frame extraction and OCR
- `textract` - Text extraction from images using Swift components
- `imageutils` - Image processing utilities
- `postprocess` - Post-processing of recorded data
- `datawriter` - Data serialization and writing

### Key Technologies
- **Frontend:** React with TypeScript, Electron renderer processes
- **Backend:** Electron main process, Node.js services
- **Database:** SQLite with Knex.js for migrations and queries
- **Build:** ESBuild for development, Webpack for production
- **Testing:** Jest with Playwright for E2E testing
- **Native Code:** Swift components for macOS-specific functionality (screen recording, text extraction)

### Communication Patterns
- **Main ↔ Renderer:** IPC with query/response pattern for database operations
- **Services:** Event-driven architecture using ActionDispatcher and AppEventEmitter
- **Data Flow:** React Query for state management in renderer processes
- **Actions vs Events:** Actions are user interactions (e.g., "start focus session"), Events are system responses (e.g., "FOCUS_SESSION_STARTED")

### Native Components
The app includes Swift-based native components for macOS:
- Screen recording and observation (`app-observer`)
- Text extraction from images (`textract`)
- Audio/video recording (`recorder`)

### Development Practices
- Independent versioning for packages using Lerna
- TypeScript throughout the codebase
- ESLint and Prettier for code formatting
- Conventional commits with Commitizen
- Uses pnpm workspaces for dependency management

## Agent Compatibility Notes
- Prefer this file as the canonical source of repository guidance.
- If a tool expects a tool-specific instructions file such as `CLAUDE.md`, it should resolve to this document when possible.
