import { GLCatFramebuffer, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';
import { RenderTarget } from './RenderTarget';

export interface BufferRenderTargetOptions {
  width: number;
  height: number;
  numBuffers?: number;
  isFloat?: boolean;
}

export class BufferRenderTarget extends RenderTarget {
  private readonly __framebuffer: GLCatFramebuffer;

  public get framebuffer(): GLCatFramebuffer {
    return this.__framebuffer;
  }

  private __width: number;

  public get width(): number {
    return this.__width;
  }

  private __height: number;

  public get height(): number {
    return this.__height;
  }

  private __numBuffers: number;

  public get numBuffers(): number {
    return this.__numBuffers;
  }

  public constructor( options: BufferRenderTargetOptions ) {
    super();

    this.__framebuffer = DISPLAY.glCat.lazyDrawbuffers(
      options.width,
      options.height,
      options.numBuffers || 1,
      options.isFloat || true
    );

    this.__width = options.width;
    this.__height = options.height;
    this.__numBuffers = options.numBuffers || 1;
  }

  public get texture(): GLCatTexture {
    return this.__framebuffer.texture!;
  }

  public getTexture( attachment: number ): GLCatTexture | null {
    return this.__framebuffer.getTexture( attachment );
  }

  public bind(): void {
    const { gl, glCat } = DISPLAY;
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.__framebuffer.raw );
    glCat.drawBuffers( this.__numBuffers );
    gl.viewport( 0, 0, this.width, this.height );
  }

  public dispose(): void {
    this.__framebuffer.dispose();
  }
}
