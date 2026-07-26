declare module "jpeg-js" {
  export interface DecodedJpeg {
    width: number;
    height: number;
    data: Uint8Array;
  }
  export function decode(
    buf: Uint8Array,
    opts?: { useTArray?: boolean; formatAsRGBA?: boolean; maxMemoryUsageInMB?: number },
  ): DecodedJpeg;
  const jpeg: { decode: typeof decode };
  export default jpeg;
}
