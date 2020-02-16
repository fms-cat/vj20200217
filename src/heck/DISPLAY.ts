import CONFIG from '../config.json';
import { GLCat } from '@fms-cat/glcat-ts';

const canvas = document.querySelector<HTMLCanvasElement>( '#canvas' )!;
canvas.width = CONFIG.resolution[ 0 ];
canvas.height = CONFIG.resolution[ 1 ];

const gl = canvas.getContext( 'webgl' )!;
gl.lineWidth( 1 );

const glCat = new GLCat( gl );

glCat.getExtension( 'EXT_frag_depth', true );
glCat.getExtension( 'OES_standard_derivatives', true );
glCat.getExtension( 'OES_texture_float', true );
glCat.getExtension( 'OES_texture_float_linear', true );

export const DISPLAY = {
  canvas,
  gl,
  glCat
};
