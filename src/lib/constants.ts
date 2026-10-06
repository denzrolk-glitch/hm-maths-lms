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
/** A live session is considered over this many minutes after it starts. */
export const LIVE_DURATION_MINUTES = 240;
