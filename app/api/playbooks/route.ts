import { NextResponse } from "next/server";
import { inputSchema, validateInput } from "@/lib/playbooks";
import { runInvestigation } from "@/lib/investigation-engine";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

export async function POST(request: Request) {
  const key = request.headers.get("x-nansen-api-key")?.trim() ?? "";
  if (!key || key.length > 512) return NextResponse.json({ error: "Connect a valid Nansen API key before running an investigation." }, { status: 401, headers: noStore });
  const input: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid investigation inputs. Check the tool, chain, window, and thresholds." }, { status: 422, headers: noStore });
  const issue = validateInput(parsed.data);
  if (issue) return NextResponse.json({ error: issue }, { status: 422, headers: noStore });
  const result = await runInvestigation(parsed.data, key);
  return NextResponse.json(result, { headers: noStore });
}
