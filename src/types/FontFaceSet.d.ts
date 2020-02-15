declare interface FontFaceSet extends Set<FontFace> {
  load( font: string, text?: string ): Promise<FontFace[]>;
}

declare global {
  interface Document {
    fonts: FontFaceSet;
  }
}

export default undefined;
