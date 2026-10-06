export const TOWNS = ["Panadura", "Horana", "Mathugama", "Kalutara", "Online"] as const;
export type Town = (typeof TOWNS)[number];

export const CLASS_TYPES = ["Theory", "Revision", "Paper Class", "Extra Class", "Free Seminar"] as const;
export type ClassType = (typeof CLASS_TYPES)[number];

export const NOTICE_TAGS = ["General", "Urgent", "Exam Notice"] as const;
export type NoticeTag = (typeof NOTICE_TAGS)[number];

export const AL_YEARS = [2026, 2027, 2028, 2029] as const;

export const DISTRICTS = [
  "Kalutara", "Colombo", "Gampaha", "Galle", "Matara", "Hambantota", "Ratnapura", "Kegalle", "Kandy", "Matale",
  "Nuwara Eliya", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Ampara",
  "Batticaloa", "Trincomalee", "Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya",
] as const;

export const LIVE_UNLOCK_MINUTES = 20;
/** Default class length when neither the session nor the class sets one. */
export const LIVE_DURATION_MINUTES = 120;
/** The join link stays open this long after the scheduled end (classes often run over). */
export const LIVE_GRACE_MINUTES = 30;
/** Class length choices in the admin forms (minutes). */
export const DURATION_OPTIONS = [60, 90, 120, 150, 180, 210, 240, 300] as const;
/** Week starts on Monday in the day picker; values are JS/Postgres day numbers (0 = Sunday). */
export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;
