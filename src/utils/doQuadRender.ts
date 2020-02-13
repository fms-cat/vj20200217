import { GL, GLCatFramebuffer, GLCatProgramUniformType, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { Shaders } from '../shaders';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';

const vboQuad = DISPLAY.glCat.createBuffer();
vboQuad.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

export async function doQuadRender( options: {
  width: number;
  height: number;
  frag: string;
  target: GLCatFramebuffer;
  uniforms?: Array<{ name: string; type: GLCatProgramUniformType; value: number[] }>;
  uniformTextures?: Array<{ name: string; texture: GLCatTexture }>;
  range?: [ number, number, number, number ];
} ): Promise<void> {
  const { gl, glCat } = DISPLAY;

  const program = await glCat.lazyProgramAsync(
    Shaders.quadVert,
    options.frag
  );

  const range = options.range || [ -1.0, -1.0, 1.0, 1.0 ];

  glCat.useProgram( program );

  gl.bindFramebuffer( gl.FRAMEBUFFER, options.target.raw );
  glCat.drawBuffers( [ gl.COLOR_ATTACHMENT0 ] );
  gl.viewport( 0, 0, options.width, options.height );

  program.attribute( 'p', vboQuad, 2 );
  program.uniform2f( 'resolution', options.width, options.height );
  program.uniform4f( 'range', ...range );

  options.uniforms?.forEach( ( uniform ) => {
    program.uniform( uniform.name, uniform.type, ...uniform.value );
  } );

  options.uniformTextures?.forEach( ( uniform ) => {
    program.uniformTexture( uniform.name, uniform.texture );
  } );

  gl.drawArrays( GL.TRIANGLE_STRIP, 0, 4 );

  glCat.useProgram( null );
  program.dispose();
}
