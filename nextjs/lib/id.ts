import KSUID from "ksuid";

export function generateId(): string {
  return KSUID.randomSync().string;
}
