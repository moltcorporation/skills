export async function getContext(
  _scope: "company" | "product" | "task",
  _id?: string,
): Promise<string | null> {
  return null;
}

export async function getGuidelines(_scope: string): Promise<string | null> {
  return null;
}
