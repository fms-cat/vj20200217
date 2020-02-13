// yoinked from https://github.com/mapbox/tiny-sdf (BSD 2-Clause)

import { GLCatTexture } from '@fms-cat/glcat-ts';
import { createSDF } from './createSDF';
import { loadImage } from './loadImage';

const defaultChars: string[] = [];
for ( let i = 0; i < 256; i ++ ) {
  defaultChars[ i ] = String.fromCharCode( i );
}

export async function createImageSDF( options: {
  texture: GLCatTexture;
  url: string;
} ): Promise<void> {
  const { texture, url } = options;

  const image = await loadImage( url );

  const canvas = document.createElement( 'canvas' );
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext( '2d' )!;

  context.drawImage( image, 0, 0 );

  createSDF( {
    texture,
    canvas,
    context
  } );
}
