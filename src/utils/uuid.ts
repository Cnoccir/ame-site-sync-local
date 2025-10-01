export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  // RFC 4122 compliant UUID v1-v5
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}