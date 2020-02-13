// yoinked from https://github.com/mapbox/tiny-sdf (BSD 2-Clause)

import { GL, GLCatTexture } from '@fms-cat/glcat-ts';
import { edt2d } from './edt';

const HUGE = 1E8;

export function createSDF( options: {
  texture: GLCatTexture;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
} ): GLCatTexture {
  const { texture, canvas, context } = options;
  const { width, height } = canvas;

  const imageData = context.getImageData( 0, 0, canvas.width, canvas.height );
  const inside = new Float32Array( width * height );
  const outside = new Float32Array( width * height );

  for ( let i = 0; i < width * height; i ++ ) {
    const v = imageData.data[ i * 4 + 3 ] / 255.0;
    inside[ i ] = (
      v === 1.0 ? HUGE :
      v === 0.0 ? 0.0 :
      Math.max( 0.0, v - 0.5 )
    );

    outside[ i ] = (
      v === 1.0 ? 0.0 :
      v === 0.0 ? HUGE :
      Math.max( 0.0, 0.5 - v )
    );
  }

  edt2d( inside, width, height );
  edt2d( outside, width, height );

  for ( let i = 0; i < width * height; i ++ ) {
    outside[ i ] = ( outside[ i ] - inside[ i ] );
  }

  texture.setTextureFromFloatArray( width, height, outside, GL.LUMINANCE );

  return texture;
}
