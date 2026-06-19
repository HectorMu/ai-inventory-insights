const MUTATION_TOOL_CACHE_MAP: Record<string, string[][]> = {
  confirm_restock_order: [["orders"]],
  confirm_bulk_restock: [["orders"]],
  confirm_fulfill_order: [["orders"], ["products"], ["dashboard"]],
};

export function getInvalidationKeysFromMessage(message: {
  parts?: { type: string; toolName?: string; state?: string }[];
}): string[][] {
  const seen = new Set<string>();
  const keys: string[][] = [];
  for (const part of message.parts ?? []) {
    if (
      part.type === "dynamic-tool" &&
      part.toolName &&
      part.toolName in MUTATION_TOOL_CACHE_MAP &&
      (part.state === "output-available" || part.state === "result")
    ) {
      for (const key of MUTATION_TOOL_CACHE_MAP[part.toolName]) {
        const keyStr = JSON.stringify(key);
        if (!seen.has(keyStr)) {
          seen.add(keyStr);
          keys.push(key);
        }
      }
    }
  }
  return keys;
}
