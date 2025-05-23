export function isErrorWithMessage(e: unknown): e is { message: string } {
  return !!(
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as Record<string, unknown>).message === "string"
  );
}