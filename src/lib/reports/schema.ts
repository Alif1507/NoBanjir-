import { z } from "zod";

export const reportCategorySchema = z.enum(["GENANGAN", "SALURAN_TERSUMBAT", "SAMPAH", "LAINNYA"]);
export const reportStatusSchema = z.enum(["DIKIRIM", "DIPROSES", "SELESAI", "DITOLAK"]);
export const reportInputSchema = z.object({
  category: reportCategorySchema,
  location_text: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(2000),
}).strict();
export type ReportInput = z.infer<typeof reportInputSchema>;

export function parseReport(value: unknown) { return reportInputSchema.safeParse(value); }

export const reportTransitionSchema = z.object({
  status: z.enum(["DIPROSES", "SELESAI", "DITOLAK"]),
  staff_note: z.string().trim().max(1000).default(""),
}).strict().refine(value => value.status !== "DITOLAK" || value.staff_note.length >= 5,
  { path: ["staff_note"], message: "Alasan penolakan wajib diisi." });
export function parseReportTransition(value: unknown) { return reportTransitionSchema.safeParse(value); }

export const reportSchema = z.object({
  id: z.uuid(), category: reportCategorySchema, location_text: z.string().optional(),
  description: z.string().optional(), status: reportStatusSchema,
  created_at: z.string(), updated_at: z.string(),
  photo_path: z.string().nullable().optional(), staff_note: z.string().nullable().optional(),
  reporter_id: z.uuid().optional(),
});
export type EnvironmentReport = z.infer<typeof reportSchema>;

export const categoryLabels: Record<z.infer<typeof reportCategorySchema>, string> = {
  GENANGAN: "Genangan", SALURAN_TERSUMBAT: "Saluran tersumbat",
  SAMPAH: "Sampah", LAINNYA: "Lainnya",
};
export const statusLabels: Record<z.infer<typeof reportStatusSchema>, string> = {
  DIKIRIM: "Dikirim", DIPROSES: "Diproses", SELESAI: "Selesai", DITOLAK: "Ditolak",
};
