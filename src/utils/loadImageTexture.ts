import { GLCatTexture } from '@fms-cat/glcat-ts';
import { loadImage } from './loadImage';

export async function loadImageTexture( options: {
  url: string;
  texture: GLCatTexture;
} ): Promise<void> {
  const { url, texture } = options;
  const image = await loadImage( url );
  texture.setTexture( image );
}
