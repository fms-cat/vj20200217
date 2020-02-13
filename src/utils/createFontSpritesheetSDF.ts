// yoinked from https://github.com/mapbox/tiny-sdf (BSD 2-Clause)

import { GLCatTexture } from '@fms-cat/glcat-ts';
import { createSDF } from './createSDF';

const defaultChars: string[] = [];
for ( let i = 0; i < 256; i ++ ) {
  defaultChars[ i ] = String.fromCharCode( i );
}

export async function createFontSpritesheetSDF( options: {
  texture: GLCatTexture;
  charSize: [ number, number ];
  matrix?: [ number, number ];
  font: string;
  baseline?: number;
  chars?: string[];
} ): Promise<void> {
  const { texture, charSize, font } = options;
  const matrix = options.matrix || [ 16, 16 ];
  const chars = options.chars || defaultChars;
  const baseline = options.baseline || 0.8;

  const canvas = document.createElement( 'canvas' );
  canvas.width = charSize[ 0 ] * matrix[ 0 ];
  canvas.height = charSize[ 1 ] * matrix[ 1 ];

  const context = canvas.getContext( '2d' )!;
  context.textAlign = 'center';
  context.fillStyle = '#fff';

  await ( document as any ).fonts.load( font );
  context.font = font;

  for ( let i = 0; i < 256; i ++ ) {
    const char = chars[ i ];
    const x = ( ( i % matrix[ 0 ] ) + 0.5 ) * charSize[ 0 ];
    const y = ( Math.floor( i / matrix[ 0 ] ) + baseline ) * charSize[ 1 ];
    context.fillText( char, x, y );
  }

  createSDF( {
    texture,
    canvas,
    context
  } );
}
