const PREVIEW_MAX_LENGTH = 500;

export function toPreview(text: string, maxLength = PREVIEW_MAX_LENGTH): string {
  return text.slice(0, maxLength);
}
