export const Constants = {
  UNINITIALIZED_ID: "-1", // ajksdh_
  UNINITIALIZED_NUMBER: -1,
  EMPTY_STRING: "",
  JSON_STORAGE_PATH: "./data/common/",
  USER_WENT_AWAY_THRESHOLD: 600, // 60 seconds
  INACTIVE_ACTIVE_THRESHOLD: 200, // 5 minutes
  GOING_INACTIVE_THRESHOLD: 105, // 2 minutes
  HYPER_ACTIVE_THRESHOLD: 6, // 6 seconds seconds
  HYPER_ACTIVE_ZONE_TIME_IN_SECONDS: 50, // 60 seconds
  HYPER_ACTIVE_ZONE_BEGIN_TIME_IN_SECONDS: 15, // 20 seconds
};

export const ErrorMessages = {
  DEFAULT_SCREEN_TO_RECORD_NOT_SET: "Default screen to record not set",
  FOCUS_SESSION_ALREADY_IN_PROGRESS: "Focus session already in progress",
};
