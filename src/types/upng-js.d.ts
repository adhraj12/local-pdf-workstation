declare module 'upng-js' {
  interface DecodeResult {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    frames: Array<{
      rect: { x: number; y: number; width: number; height: number };
      delay: number;
      dispose: number;
      blend: number;
    }>;
    tabs: Record<string, any>;
    data: ArrayBuffer;
  }

  function decode(buffer: ArrayBuffer): DecodeResult;
  function toRGBA8(img: DecodeResult): ArrayBuffer[];
  function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[],
    forbidPlte?: boolean
  ): ArrayBuffer;
}
