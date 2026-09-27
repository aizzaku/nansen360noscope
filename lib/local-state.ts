import { z } from "zod";
import { inputSchema, resultSchema, toolIds } from "./playbooks";

export const storageKey = "nansen360:v1";
const lessonSchema = z.object({ stage: z.number().int().min(0).max(4), hypothesis: z.string().max(2000), verdict: z.number().int().min(0).max(2).nullable(), completed: z.boolean() });
export const savedSchema = z.object({ id: z.string(), name: z.string().max(100), pinned: z.boolean(), savedAt: z.string().datetime(), input: inputSchema, result: resultSchema });
export type SavedInvestigation = z.infer<typeof savedSchema>;
const stateSchema = z.object({ version: z.literal(1), welcomed: z.boolean(), investigateGuideSeen: z.boolean().default(false), mode: z.enum(["learn", "investigate"]), active: z.enum(toolIds), lessons: z.record(z.enum(toolIds), lessonSchema), library: z.array(savedSchema).max(50) });
export type LocalState = z.infer<typeof stateSchema>;
export const freshLesson = () => ({ stage: 0, hypothesis: "", verdict: null, completed: false });
export const initialState = (): LocalState => ({ version: 1, welcomed: false, investigateGuideSeen: false, mode: "investigate", active: "wallet", lessons: Object.fromEntries(toolIds.map(id => [id, freshLesson()])), library: [] });
export function readLocalState(): { state: LocalState; error: string | null } {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { state: initialState(), error: null };
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { state: initialState(), error: "Saved browser data is obsolete or damaged. A fresh session was opened; new changes will replace it." };
    return { state: { ...parsed.data, mode: "investigate", lessons: { ...initialState().lessons, ...parsed.data.lessons } }, error: null };
  } catch { return { state: initialState(), error: "Browser storage could not be read. You can continue, but progress may not persist." }; }
}
export function writeLocalState(state: LocalState): string | null {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); return null; }
  catch { return "Changes are only in memory: browser storage is blocked or full. Remove old investigations or allow storage to save again."; }
}
export function compactResult(result: z.infer<typeof resultSchema>) {
  return { ...result, evidence: result.evidence.map(block => ({ ...block, rows: block.rows.slice(0, 10), bars: block.bars?.slice(0, 10) })), candidates: result.candidates?.slice(0, 5) };
}
