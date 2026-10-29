import { z } from 'zod';
const record = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const date = new Date(`${v}T12:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === v; }),
  type: z.number().int().min(1).max(7),
  comfort: z.enum(['很顺畅', '正常', '有点费劲', '很费劲']).nullable(),
  duration: z.enum(['不足 1 分钟', '1–3 分钟', '3–5 分钟', '超过 5 分钟']).nullable(),
  symptoms: z.array(z.enum(['血便或黑便', '持续或剧烈腹痛', '发热或呕吐', '明显口渴、尿少或头晕'])).max(4),
  note: z.string().max(500).optional(),
}).strict();
export const requestSchema = z.object({ version: z.literal(1), records: z.array(record).max(1000), question: z.string().max(1000) }).strict().refine(v => v.records.length > 0 || v.question.trim().length > 0);
export const analysisSchema = z.object({
  summary: z.string().min(1).max(1200),
  observations: z.array(z.string().min(1).max(600)).min(1).max(6),
  suggestions: z.array(z.string().min(1).max(600)).min(1).max(6),
  seekCare: z.array(z.string().min(1).max(600)).min(1).max(6),
  limitations: z.string().min(1).max(1200),
});
export type AnalysisRequest = z.infer<typeof requestSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
