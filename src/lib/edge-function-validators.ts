import { z } from "zod";

// Date validation schema - ensures valid YYYY-MM-DD format
const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Data deve estar no formato YYYY-MM-DD"
);

// Ads insights request validation
export const adsInsightsParamsSchema = z.object({
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  activeOnly: z.boolean().optional().default(false),
  integrationId: z.string().uuid().optional(),
});

export type AdsInsightsParams = z.infer<typeof adsInsightsParamsSchema>;

// Google Sheets leads request validation  
export const sheetsLeadsParamsSchema = z.object({
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  integrationId: z.string().uuid().optional(),
});

export type SheetsLeadsParams = z.infer<typeof sheetsLeadsParamsSchema>;

// Validate and throw user-friendly errors
export function validateAdsInsightsParams(params: unknown): AdsInsightsParams {
  const result = adsInsightsParamsSchema.safeParse(params);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(", ");
    throw new Error(`Parâmetros inválidos: ${errors}`);
  }
  
  // Additional validation: dateFrom should be <= dateTo
  if (result.data.dateFrom > result.data.dateTo) {
    throw new Error("Data inicial não pode ser maior que a data final");
  }
  
  return result.data;
}

export function validateSheetsLeadsParams(params: unknown): SheetsLeadsParams {
  const result = sheetsLeadsParamsSchema.safeParse(params);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(", ");
    throw new Error(`Parâmetros inválidos: ${errors}`);
  }
  
  if (result.data.dateFrom > result.data.dateTo) {
    throw new Error("Data inicial não pode ser maior que a data final");
  }
  
  return result.data;
}

// Helper to format date safely
export function formatDateSafe(date: Date | undefined | null): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split("T")[0];
}

// Validate date range before API call
export function validateDateRange(from: Date | undefined, to: Date | undefined): { dateFrom: string; dateTo: string } | null {
  const dateFrom = formatDateSafe(from);
  const dateTo = formatDateSafe(to);
  
  if (!dateFrom || !dateTo) {
    console.warn("Date range validation failed: missing dates");
    return null;
  }
  
  if (dateFrom > dateTo) {
    console.warn("Date range validation failed: dateFrom > dateTo");
    return null;
  }
  
  return { dateFrom, dateTo };
}
