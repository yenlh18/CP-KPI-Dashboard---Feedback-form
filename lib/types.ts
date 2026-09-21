import { z } from "zod";

export const scoreSchema = z.number().int().min(1).max(5);

export const feedbackPayloadSchema = z.object({
  lang: z.enum(["vi", "en"]),
  domain: z.string().trim().min(1).max(200),
  overall: scoreSchema,
  overallFeedback: z.string().trim().max(4000).optional().default(""),
  startClarity: scoreSchema.optional().nullable(),
  clarityKpi: scoreSchema.optional().nullable(),
  clarityScore: scoreSchema.optional().nullable(),
  changeFlow: scoreSchema.optional().nullable(),
  supportClarity: scoreSchema.optional().nullable(),
  timeSaved: scoreSchema.optional().nullable(),
  changeNote: z.string().trim().max(4000).optional().default(""),
});
export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

export const bugPayloadSchema = z.object({
  lang: z.enum(["vi", "en"]),
  issue: z.string().trim().min(1).max(4000),
  whereTags: z.array(z.string()).max(20).optional().default([]),
  domain: z.string().trim().max(200).optional().default(""),
  screenshotUrls: z
    .array(
      z
        .string()
        .trim()
        .url()
        .max(2000)
        .refine((url) => new URL(url).hostname.endsWith(".public.blob.vercel-storage.com"), {
          message: "screenshotUrls entries must be Vercel Blob URLs",
        })
    )
    .max(5)
    .optional()
    .default([]),
});
export type BugPayload = z.infer<typeof bugPayloadSchema>;

export const easeSkipSchema = z.number().int().min(0).max(5);

export const trainingPayloadSchema = z
  .object({
    lang: z.enum(["vi", "en"]),
    domain: z.string().trim().min(1).max(200),
    easeSubmitResults: easeSkipSchema,
    easeEditKpis: easeSkipSchema,
    easeDeptScorecard: easeSkipSchema,
    easeKira: easeSkipSchema,
    wantsSupport: z.boolean(),
    supportAreas: z.array(z.string()).max(20).optional().default([]),
    supportOtherDetail: z.string().trim().max(2000).optional().default(""),
    painPoint: z.string().trim().max(4000).optional().default(""),
  })
  .refine((data) => !data.wantsSupport || data.supportAreas.length > 0, {
    message: "supportAreas is required when wantsSupport is true",
    path: ["supportAreas"],
  })
  .refine(
    (data) =>
      (!data.supportAreas.includes("Khác") && !data.supportAreas.includes("Other")) ||
      data.supportOtherDetail.trim() !== "",
    { message: "supportOtherDetail is required when 'Khác'/'Other' is selected", path: ["supportOtherDetail"] }
  );
export type TrainingPayload = z.infer<typeof trainingPayloadSchema>;

// Response record shapes, as read back from the database (for /admin).
export interface FeedbackRow {
  id: string;
  created_at: string;
  lang: string;
  domain: string;
  overall: number;
  overall_feedback: string | null;
  start_clarity: number | null;
  clarity_kpi: number | null;
  clarity_score: number | null;
  change_flow: number | null;
  support_clarity: number | null;
  time_saved: number | null;
  change_note: string | null;
}

export interface BugRow {
  id: string;
  created_at: string;
  lang: string;
  issue: string;
  where_tags: string[];
  domain: string | null;
  screenshot_urls: string[];
}

export interface TrainingFeedbackRow {
  id: string;
  created_at: string;
  lang: string;
  domain: string;
  ease_submit_results: number;
  ease_edit_kpis: number;
  ease_dept_scorecard: number;
  ease_kira: number;
  wants_support: boolean;
  support_areas: string[];
  support_other_detail: string | null;
  pain_point: string | null;
}
