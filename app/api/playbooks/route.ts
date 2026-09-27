import { NextResponse } from "next/server";
import { inputSchema, validateInput } from "@/lib/playbooks";
import { demoEvidence } from "@/lib/demo-evidence";
import { runInvestigation } from "@/lib/investigation-engine";

export const runtime = "edge";
export async function GET() {
  return NextResponse.json({ liveAvailable: Boolean(process.env.NANSEN_API_KEY) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid investigation inputs. Check the tool, chain, window, and thresholds." }, { status: 422 });
  const issue = validateInput(parsed.data);
  if (issue) return NextResponse.json({ error: issue }, { status: 422 });
  if (parsed.data.demo) return NextResponse.json(demoEvidence(parsed.data));
  const key = process.env.NANSEN_API_KEY;
  if (!key) return NextResponse.json({ error: "Live data is not configured. Choose the labelled demo or configure NANSEN_API_KEY on the server." }, { status: 503 });
  const result = await runInvestigation(parsed.data, key);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
