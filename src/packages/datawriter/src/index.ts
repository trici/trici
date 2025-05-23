import * as protobuf from 'protobufjs';
import { idleTimeProfileProtoContent } from './protos';

export interface IDataWriter {
  convertIdleTimeProfile: (profile: { idleTime: number; timestamp: number }[]) => Buffer;
  convertIdleTimeProfileChunk: (profile: { idleTime: number; timestamp: number }[]) => any;
  convertIdleTimeProfileChunks: (chunks: { idleTime: number; timestamp: number }[][]) => Buffer;
  readIdleTimeProfileFromBuffer: (buffer: Buffer) => { idleTime: number; timestamp: number }[];
}

export const DataWriter: IDataWriter = {
  // For backward compatibility: wraps a single chunk in IdleTimeProfile
  convertIdleTimeProfile: (profile: { idleTime: number; timestamp: number }[]): Buffer => {
    if (!profile.length) {
      return Buffer.alloc(0);
    }
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeProfile = root.lookupType('trici.IdleTimeProfile');
    const IdleTimeChunk = root.lookupType('trici.IdleTimeChunk');
    const startTimestamp = profile[0].timestamp;
    const entries = profile.map((entry, index) => ({
      idleTime: entry.idleTime,
      timestampDelta: index === 0 ? 0 : entry.timestamp - profile[index - 1].timestamp,
    }));
    const chunk = IdleTimeChunk.create({ startTimestamp, entries });
    const message = IdleTimeProfile.create({ chunks: [chunk] });
    return Buffer.from(IdleTimeProfile.encode(message).finish());
  },

  // Converts a single chunk to a JS object (not buffer)
  convertIdleTimeProfileChunk: (profile: { idleTime: number; timestamp: number }[]) => {
    if (!profile.length) return null;
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeChunk = root.lookupType('trici.IdleTimeChunk');
    const startTimestamp = profile[0].timestamp;
    const entries = profile.map((entry, index) => ({
      idleTime: entry.idleTime,
      timestampDelta: index === 0 ? 0 : entry.timestamp - profile[index - 1].timestamp,
    }));
    return IdleTimeChunk.create({ startTimestamp, entries });
  },

  // Converts an array of chunks to a single IdleTimeProfile buffer
  convertIdleTimeProfileChunks: (chunks: { idleTime: number; timestamp: number }[][]): Buffer => {
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeProfile = root.lookupType('trici.IdleTimeProfile');
    const IdleTimeChunk = root.lookupType('trici.IdleTimeChunk');
    const chunkObjs = chunks
      .filter(chunk => chunk.length > 0)
      .map(profile => {
        const startTimestamp = profile[0].timestamp;
        const entries = profile.map((entry, index) => ({
          idleTime: entry.idleTime,
          timestampDelta: index === 0 ? 0 : entry.timestamp - profile[index - 1].timestamp,
        }));
        return IdleTimeChunk.create({ startTimestamp, entries });
      });
    const message = IdleTimeProfile.create({ chunks: chunkObjs });
    return Buffer.from(IdleTimeProfile.encode(message).finish());
  },

  // Reads and merges all chunks from a buffer
  readIdleTimeProfileFromBuffer: (buffer: Buffer) => {
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeProfile = root.lookupType('trici.IdleTimeProfile');
    const message = IdleTimeProfile.decode(buffer);
    const object = IdleTimeProfile.toObject(message, {
      longs: Number,
      enums: String,
      defaults: true,
    });
    if (!object.chunks || !Array.isArray(object.chunks)) return [];
    // Merge all chunks in order
    let result: { idleTime: number; timestamp: number }[] = [];
    for (const chunk of object.chunks) {
      let currentTimestamp = chunk.startTimestamp as number;
      for (const entry of chunk.entries) {
        currentTimestamp += entry.timestampDelta;
        result.push({ idleTime: entry.idleTime, timestamp: currentTimestamp });
      }
    }
    return result;
  },
};
