export const idleTimeProfileProtoContent = `
syntax = "proto3";

package trici;

message IdleTimeEntry {
  int32 idleTime = 1;
  int32 timestampDelta = 2;
}

message IdleTimeChunk {
  int64 startTimestamp = 1;
  repeated IdleTimeEntry entries = 2;
}

message IdleTimeProfile {
  repeated IdleTimeChunk chunks = 1;
}
`;
