declare class FontFace {
  public style: string;
  public weight: string;
  public constructor( name: string, path: string );
  public load(): Promise<FontFace>;
}
