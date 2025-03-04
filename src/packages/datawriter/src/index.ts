import * as protobuf from 'protobufjs';
import { idleTimeProfileProtoContent } from './protos';

export interface IDataWriter {
  convertIdleTimeProfile: (profile: { idleTime: number; timestamp: number }[]) => Buffer;
  readIdleTimeProfileFromBuffer: (buffer: Buffer) => { idleTime: number; timestamp: number }[];
}

export const DataWriter: IDataWriter = {
  convertIdleTimeProfile: (profile: { idleTime: number; timestamp: number }[]): Buffer => {
    if (!profile.length) {
      return Buffer.alloc(0);
    }

    // Load the proto file
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeProfile = root.lookupType('trici.IdleTimeProfile');

    // Use the first timestamp as start_timestamp
    const startTimestamp = profile[0].timestamp;

    // Convert profile entries to proto format with timestamp deltas
    const entries = profile.map((entry, index) => ({
      idleTime: entry.idleTime,
      timestampDelta: index === 0 ? 0 : entry.timestamp - profile[index - 1].timestamp,
    }));

    // Create the message
    const message = IdleTimeProfile.create({
      startTimestamp,
      entries,
    });

    // Encode and return as buffer
    return Buffer.from(IdleTimeProfile.encode(message).finish());
  },

  readIdleTimeProfileFromBuffer: (buffer: Buffer) => {
    const root = protobuf.parse(idleTimeProfileProtoContent).root;
    const IdleTimeProfile = root.lookupType('trici.IdleTimeProfile');
    const message = IdleTimeProfile.decode(buffer);

    // Convert the message to a plain JS object.
    // The "longs: Number" option converts int64 values (stored as Long objects) to native numbers.
    const object = IdleTimeProfile.toObject(message, {
      longs: Number,
      enums: String,
      defaults: true,
    });

    // Extract the start timestamp (now a number) and reconstruct timestamps from the delta values.
    const startTimestamp = object.startTimestamp as number;
    let currentTimestamp = startTimestamp;
    const jsonResult = object.entries.map((entry: any) => {
      const timestamp = currentTimestamp + entry.timestampDelta;
      currentTimestamp = timestamp;
      return {
        idleTime: entry.idleTime,
        timestamp,
      };
    });
    return jsonResult;
  },
};
