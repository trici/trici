import { DataWriter } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('IdleTimeProfile Conversion', () => {
  let sampleData: { idleTime: number; timestamp: number }[];

  beforeAll(() => {
    // Read the sample data
    sampleData = JSON.parse(fs.readFileSync(path.join(__dirname, '../sampledata/sampleItp.json'), 'utf8'));
  });

  it('should convert empty profile to empty buffer', () => {
    const buffer = DataWriter.convertIdleTimeProfile([]);
    expect(buffer.length).toBe(0);
  });

  it('should convert profile to protobuf and back to json maintaining data integrity', () => {
    // Convert to protobuf
    const protobufData = DataWriter.convertIdleTimeProfile(sampleData);

    // Verify buffer is not empty
    expect(protobufData.length).toBeGreaterThan(0);

    // Convert back to JSON
    const convertedData = DataWriter.readIdleTimeProfileFromBuffer(protobufData);

    // Verify array lengths match
    expect(convertedData.length).toBe(sampleData.length);

    // Verify each entry matches
    sampleData.forEach((original, index) => {
      const converted = convertedData[index];
      expect(converted).toEqual(original);
    });
  });

  it('should maintain timestamp sequence and deltas correctly', () => {
    const testData = [
      { idleTime: 100, timestamp: 1000 },
      { idleTime: 200, timestamp: 1500 },
      { idleTime: 300, timestamp: 2200 },
    ];

    const protobufData = DataWriter.convertIdleTimeProfile(testData);
    const convertedData = DataWriter.readIdleTimeProfileFromBuffer(protobufData);

    // Verify timestamps are maintained
    testData.forEach((original, index) => {
      expect(convertedData[index].timestamp).toBe(original.timestamp);
    });

    // Verify deltas between timestamps are maintained
    for (let i = 1; i < testData.length; i++) {
      const originalDelta = testData[i].timestamp - testData[i - 1].timestamp;
      const convertedDelta = convertedData[i].timestamp - convertedData[i - 1].timestamp;
      expect(convertedDelta).toBe(originalDelta);
    }
  });

  it('should maintain idle time values correctly', () => {
    const testData = [
      { idleTime: 100, timestamp: 1000 },
      { idleTime: 200, timestamp: 1500 },
      { idleTime: 300, timestamp: 2200 },
    ];

    const protobufData = DataWriter.convertIdleTimeProfile(testData);
    const convertedData = DataWriter.readIdleTimeProfileFromBuffer(protobufData);

    // Verify idle time values are maintained
    testData.forEach((original, index) => {
      expect(convertedData[index].idleTime).toBe(original.idleTime);
    });
  });
});
