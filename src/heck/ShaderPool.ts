import { GL, GLCatProgram, GLCatShader } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';

export class ShaderPool {
  private __vertexShaderMap: Map<string, GLCatShader> = new Map();

  private __fragmentShaderMap: Map<string, GLCatShader> = new Map();

  private __programMap: Map<GLCatShader, Map<GLCatShader, GLCatProgram>> = new Map();

  public getVertexShader( vert: string ): GLCatShader {
    let shader = this.__vertexShaderMap.get( vert );

    if ( shader ) { return shader; }

    shader = DISPLAY.glCat.createShader( GL.VERTEX_SHADER );
    shader.compile( vert );
    this.__vertexShaderMap.set( vert, shader );

    return shader;
  }

  public getFragmentShader( frag: string ): GLCatShader {
    let shader = this.__fragmentShaderMap.get( frag );

    if ( shader ) { return shader; }

    shader = DISPLAY.glCat.createShader( GL.FRAGMENT_SHADER );
    shader.compile( frag );
    this.__fragmentShaderMap.set( frag, shader );

    return shader;
  }

  public getProgram( vert: string, frag: string ): GLCatProgram {
    const vertex = this.getVertexShader( vert );
    const fragment = this.getFragmentShader( frag );

    let program = this.__getProgramFromMap( vertex, fragment );
    if ( program ) { return program; }

    program = DISPLAY.glCat.createProgram();
    this.__setProgramToMap( vertex, fragment, program );
    program.link( vertex, fragment );

    return program;
  }

  public getProgramAsync( vert: string, frag: string ): Promise<GLCatProgram> {
    try {
      const vertex = this.getVertexShader( vert );
      const fragment = this.getFragmentShader( frag );

      let program = this.__getProgramFromMap( vertex, fragment );
      if ( program ) { return Promise.resolve( program ); }

      program = DISPLAY.glCat.createProgram();
      this.__setProgramToMap( vertex, fragment, program );
      return program.linkAsync( vertex, fragment ).then( () => {
        return program!;
      } );
    } catch ( e ) {
      return Promise.reject( e );
    }
  }

  public deleteProgram(
    vert: string,
    frag: string,
    alsoDisposeVertex = false,
    alsoDisposeFragment = false
  ): void {
    const vertex = this.__vertexShaderMap.get( vert )!;
    const fragment = this.__fragmentShaderMap.get( frag )!;
    const program = this.__getProgramFromMap( vertex, fragment )!;

    program.dispose();
    this.__deleteProgramFromMap( vertex, fragment );

    if ( alsoDisposeVertex ) {
      vertex.dispose();
      this.__vertexShaderMap.delete( vert );
    }

    if ( alsoDisposeFragment ) {
      fragment.dispose();
      this.__fragmentShaderMap.delete( frag );
    }
  }

  private __getProgramFromMap(
    vertex: GLCatShader,
    fragment: GLCatShader
  ): GLCatProgram | undefined {
    let map = this.__programMap.get( vertex );
    if ( !map ) {
      map = new Map();
      this.__programMap.set( vertex, map );
    }

    return map.get( fragment );
  }

  private __setProgramToMap(
    vertex: GLCatShader,
    fragment: GLCatShader,
    program: GLCatProgram
  ): void {
    let map = this.__programMap.get( vertex );
    if ( !map ) {
      map = new Map();
      this.__programMap.set( vertex, map );
    }

    map.set( fragment, program );
  }

  private __deleteProgramFromMap( vertex: GLCatShader, fragment: GLCatShader ): void {
    const map = this.__programMap.get( vertex )!;
    map.delete( fragment );
  }
}

export const SHADERPOOL = new ShaderPool();
