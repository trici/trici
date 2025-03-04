# @trici/datawriter

A TypeScript package that converts idle time profile data between JSON and Protocol Buffer formats.

## Overview

This package provides functionality to:
1. Convert idle time profile data from JSON to Protocol Buffer format
2. Read back Protocol Buffer data into JSON format

The package uses Protocol Buffers for efficient binary serialization of idle time profile data, which consists of timestamps and idle time measurements.

The protocol buggers are actually in the file itself and not ad separate proto files to make it easy for bundling. 
## Data Format

### JSON Format
```typescript
interface IdleTimeProfile {
  idleTime: number;   // The idle time measurement
  timestamp: number;  // Unix timestamp in milliseconds
}[]
```

### Protocol Buffer Format
```protobuf
message IdleTimeProfile {
  int64 start_timestamp = 1;
  repeated IdleTimeEntry entries = 2;
}

message IdleTimeEntry {
  int32 idle_time = 1;
  int32 timestamp_delta = 2;  // Delta from previous timestamp
}
```

## Usage

```typescript
import { DataWriter } from '@trici/datawriter';

// Convert JSON to Protocol Buffer
const profile = [
  { idleTime: 100, timestamp: 1740817688322 },
  { idleTime: 200, timestamp: 1740817688828 }
];
const buffer = DataWriter.convertIdleTimeProfile(profile);

// Read back from Protocol Buffer to JSON
const jsonData = DataWriter.readIdleTimeProfileFromBuffer(buffer);
```

## Features

- Efficient binary serialization using Protocol Buffers
- Timestamp delta encoding for reduced data size
- Type-safe interfaces for data handling
- Zero-copy buffer handling

## Installation

```bash
pnpm install @trici/datawriter
```

## Development

Build the package:
```bash
pnpm run build
```

Run tests:
```bash
pnpm test
```
