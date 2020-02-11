import { DISPLAY } from '../heck/DISPLAY';
import { GLCatTexture } from '@fms-cat/glcat-ts';

export function loadImageTexture( url: string ): GLCatTexture {
  const texture = DISPLAY.glCat.createTexture();
  texture.setTextureFromArray( 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  const image = new Image();
  image.onload = ( () => {
    texture.setTexture( image );
  } );
  image.src = url;

  return texture;
}
