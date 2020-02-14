import { GL, GLCatProgram, GLCatProgramUniformType, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';
import { EVENTMAN } from '../utils/EVENTMAN';
import { SHADERPOOL } from './ShaderPool';
import { matchAll } from '../utils/matchAll';

export class Material {
  protected __defines: {
    [ name: string ]: ( string | undefined );
  };

  protected __uniforms: {
    [ name: string ]: {
      type: GLCatProgramUniformType;
      value: number[];
    };
  } = {};

  protected __uniformVectors: {
    [ name: string ]: {
      type: GLCatProgramUniformType;
      value: Float32List | Int32List;
    };
  } = {};

  protected __uniformTextures: {
    [ name: string ]: {
      texture: GLCatTexture | null;
    };
  } = {};

  public vert: string;

  public get vertWithDefines(): string {
    return this.__definesString + this.vert;
  }

  public frag: string;

  public get fragWithDefines(): string {
    return this.__definesString + this.frag;
  }

  public get program(): GLCatProgram {
    return SHADERPOOL.getProgram( this.vertWithDefines, this.fragWithDefines, this );
  }

  public blend: [ GLenum, GLenum ] = [ GL.ONE, GL.ZERO ];

  public constructor(
    vert: string,
    frag: string,
    defines?: { [ key: string ]: ( string | undefined ) }
  ) {
    this.vert = vert;
    this.frag = frag;
    this.__defines = defines || {};
  }

  public addUniform( name: string, type: GLCatProgramUniformType, ...value: number[] ): void {
    this.__uniforms[ name ] = { type, value };
  }

  public addUniformVector(
    name: string,
    type: GLCatProgramUniformType,
    value: Float32List | Int32List
  ): void {
    this.__uniformVectors[ name ] = { type, value };
  }

  public addUniformTexture( name: string, texture: GLCatTexture | null ): void {
    this.__uniformTextures[ name ] = { texture };
  }

  public setUniforms(): void {
    const program = this.program;

    Object.entries( this.__uniforms ).forEach( ( [ name, { type, value } ] ) => {
      program.uniform( name, type, ...value );
    } );

    Object.entries( this.__uniformVectors ).forEach( ( [ name, { type, value } ] ) => {
      program.uniformVector( name, type, value );
    } );

    Object.entries( this.__uniformTextures ).forEach( ( [ name, { texture } ] ) => {
      program.uniformTexture( name, texture );
    } );
  }

  public setBlendMode(): void {
    const { gl } = DISPLAY;

    gl.blendFunc( ...this.blend );
  }

  public async compileShaderAsync(
    vert: string,
    frag: string
  ): Promise<void> {
    const d = performance.now();

    const program = await SHADERPOOL.getProgramAsync(
      this.__definesString + vert,
      this.__definesString + frag,
      this
    ).catch( ( e ) => {
      console.error( e );
      EVENTMAN.emitError( e );
      // throw e;
    } );

    if ( !program ) { return; }

    EVENTMAN.emitInfo( `Compiled a shader in ${ ( performance.now() - d ).toFixed( 3 ) }ms` );

    const regexResult = matchAll( vert + frag, /(^|\s+)([a-zA-Z][a-zA-Z0-9_]+)/gm );
    EVENTMAN.emitWords( regexResult.map( ( r ) => r[ 2 ] ) );

    const prevVert = this.__definesString + this.vert;
    const prevFrag = this.__definesString + this.frag;

    this.vert = vert;
    this.frag = frag;

    SHADERPOOL.discardProgram( prevVert, prevFrag, this );
  }

  protected get __definesString(): string {
    return Object.entries( this.__defines ).map( ( [ key, value ] ) => (
      value ? `#define ${key} ${value}\n` : ''
    ) ).join( '' );
  }
}
