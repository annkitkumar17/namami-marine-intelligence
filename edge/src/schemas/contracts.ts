import { z } from "zod";

export const SafetyVerdictSchema = z.enum(["GO", "CAUTION", "NO_GO"]);
export type SafetyVerdict = z.infer<typeof SafetyVerdictSchema>;

export const DegradedTierSchema = z.enum([
  "TIER_1_FULL",
  "TIER_2_PARTIAL_ENV",
  "TIER_3_PROJECTED_PFZ",
  "TIER_4_REFUSAL",
]);
export type DegradedTier = z.infer<typeof DegradedTierSchema>;

export const IntentTypeSchema = z.enum([
  "P1_PROXIMITY",
  "P2_GO_NOGO",
  "P3_FIELD_SEARCH",
  "P4_ROUTE",
  "P5_DIAGNOSTIC",
]);
export type IntentType = z.infer<typeof IntentTypeSchema>;

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const AskRequestSchema = z.object({
  user_id: z.string().optional().default("demo_user"),
  query_text: z.string().min(1),
  current_location: CoordinatesSchema,
  vessel_id: z.string().optional().default("vessel_001"),
  language: z.string().optional().default("en"),
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

export const LedgerStepSchema = z.object({
  step_id: z.string(),
  step_order: z.number(),
  agent_name: z.string(),
  kernel_name: z.string().nullable().optional(),
  inputs: z.record(z.any()),
  outputs: z.record(z.any()),
  execution_time_ms: z.number(),
  timestamp: z.string(),
});
export type LedgerStep = z.infer<typeof LedgerStepSchema>;

export const AdvisoryResponseSchema = z.object({
  advisory_id: z.string(),
  query_text: z.string(),
  intent_type: IntentTypeSchema,
  safety_verdict: SafetyVerdictSchema,
  degraded_tier: DegradedTierSchema,
  confidence_score: z.number().min(0).max(1),
  narrative: z.string(),
  nearest_pfz_distance_km: z.number().nullable().optional(),
  nearest_pfz_bearing_deg: z.number().nullable().optional(),
  hazards_detected: z.array(z.string()),
  ledger_steps: z.array(LedgerStepSchema),
  created_at: z.string(),
});
export type AdvisoryResponse = z.infer<typeof AdvisoryResponseSchema>;
