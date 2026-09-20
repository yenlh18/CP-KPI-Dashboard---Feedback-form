import { z } from "zod";

export const scoreSchema = z.number().int().min(1).max(5);

export const feedbackPayloadSchema = z.object({
  lang: z.enum(["vi", "en"]),
  domain: z.string().trim().min(1).max(200),
  overall: scoreSchema,
  overallFeedback: z.string().trim().max(4000).optional().default(""),
  easeSubmit: scoreSchema.optional().nullable(),
  clarityKpi: scoreSchema.optional().nullable(),
  clarityScore: scoreSchema.optional().nullable(),
  changeFlow: scoreSchema.optional().nullable(),
  changeNote: z.string().trim().max(4000).optional().default(""),
});
export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

export const bugPayloadSchema = z.object({
  lang: z.enum(["vi", "en"]),
  issue: z.string().trim().min(1).max(4000),
  whereTags: z.array(z.string()).max(20).optional().default([]),
  domain: z.string().trim().max(200).optional().default(""),
});
export type BugPayload = z.infer<typeof bugPayloadSchema>;

// Response record shapes, as read back from the database (for /admin).
export interface FeedbackRow {
  id: string;
  created_at: string;
  lang: string;
  domain: string;
  overall: number;
  overall_feedback: string | null;
  ease_submit: number | null;
  clarity_kpi: number | null;
  clarity_score: number | null;
  change_flow: number | null;
  change_note: string | null;
}

export interface BugRow {
  id: string;
  created_at: string;
  lang: string;
  issue: string;
  where_tags: string[];
  domain: string | null;
}
