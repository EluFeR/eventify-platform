// Minimal ambient declaration for `qrcode` (no @types package installed).
declare module 'qrcode' {
  export function toDataURL(text: string, options?: unknown): Promise<string>;
  const _default: { toDataURL: typeof toDataURL };
  export default _default;
}
