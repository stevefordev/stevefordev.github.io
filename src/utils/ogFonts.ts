import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

let cachedFonts: SatoriFont[] | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

export async function getOgFonts(_url?: URL): Promise<SatoriFont[]> {
  if (cachedFonts) return cachedFonts;

  const fontsDir = resolve(process.cwd(), "src/assets/fonts");
  const [regularBuf, boldBuf] = await Promise.all([
    readFile(resolve(fontsDir, "NanumGothic-Regular.ttf")),
    readFile(resolve(fontsDir, "NanumGothic-Bold.ttf")),
  ]);

  cachedFonts = [
    {
      name: "NanumGothic",
      data: toArrayBuffer(regularBuf),
      weight: 400,
      style: "normal",
    },
    {
      name: "NanumGothic",
      data: toArrayBuffer(boldBuf),
      weight: 700,
      style: "normal",
    },
  ];

  return cachedFonts;
}
