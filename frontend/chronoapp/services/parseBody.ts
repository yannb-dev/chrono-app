type ParsedBody =
  | { kind: "empty" }
  | { kind: "json"; data: unknown }
  | { kind: "text"; text: string };

export async function parseBody(res: Response): Promise<ParsedBody> {
  if (res.status === 204 || res.status === 205) {
    return { kind: "empty" };
  }
  const raw = await res.text();
  if (raw.trim() === "") {
    return { kind: "empty" };
  }
  try {
    return { kind: "json", data: JSON.parse(raw) };
  } catch {
    return { kind: "text", text: raw };
  }
}
