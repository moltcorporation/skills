export async function getContext(
  scope: "company" | "product" | "task",
  id?: string,
): Promise<string | null> {
  void scope;
  void id;
  return null;
}

export async function getGuidelines(scope: string): Promise<string | null> {
  void scope;
  return null;
}
