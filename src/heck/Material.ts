import { GL, GLCatProgram, GLCatProgramUniformType, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';
import { EVENTMAN } from '../utils/EventManager';
import { SHADERPOOL } from './ShaderPool';
import { matchAll } from '../utils/matchAll';

export class Material {
  private static __cueMaterials: Set<Material> = new Set();

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

  private __vert: string;

  public get vert(): string {
    return this.__vert;
  }

  public get vertWithDefines(): string {
    return this.__definesString + this.vert;
  }

  private __frag: string;

  public get frag(): string {
    return this.__frag;
  }

  public get fragWithDefines(): string {
    return this.__definesString + this.frag;
  }

  private __vertCue: string | null = null;

  private __fragCue: string | null = null;

  public get program(): GLCatProgram {
    return SHADERPOOL.getProgram(
      this.vertWithDefines,
      this.fragWithDefines,
      this
    );
  }

  public blend: [ GLenum, GLenum ] = [ GL.ONE, GL.ZERO ];

  public constructor(
    vert: string,
    frag: string,
    defines?: { [ key: string ]: ( string | undefined ) }
  ) {
    this.__vert = vert;
    this.__frag = frag;
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

  public async cueShader(
    vert: string,
    frag: string
  ): Promise<void> {
    if ( this.__vertCue && this.__fragCue ) {
      SHADERPOOL.discardProgram(
        this.__definesString + this.__vertCue,
        this.__definesString + this.__fragCue,
        this
      );
    }

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

    if ( !program ) {
      this.__vertCue = null;
      this.__fragCue = null;
      Material.__cueMaterials.delete( this );
      return;
    } else if ( this.program === program ) {
      this.__vertCue = null;
      this.__fragCue = null;
      Material.__cueMaterials.delete( this );
    } else {
      this.__vertCue = vert;
      this.__fragCue = frag;
      Material.__cueMaterials.add( this );
    }

    EVENTMAN.emitInfo( `Compiled a shader in ${ ( performance.now() - d ).toFixed( 3 ) }ms` );
  }

  public applyCueProgram(): void {
    if ( !this.__vertCue || !this.__fragCue ) {
      console.warn( 'Attempt to apply a cue program but there was no cue' );
      return;
    }

    const prevVert = this.vertWithDefines;
    const prevFrag = this.fragWithDefines;

    this.__vert = this.__vertCue;
    this.__frag = this.__fragCue;

    SHADERPOOL.discardProgram( prevVert, prevFrag, this );

    this.__vertCue = null;
    this.__fragCue = null;

    EVENTMAN.emitInfo( 'Applied a shader' );

    const str = this.__vert + this.__frag;
    const regexResult = matchAll( str, /(^|\s+)([a-zA-Z][a-zA-Z0-9_]+)/gm );
    EVENTMAN.emitWords( regexResult.map( ( r ) => r[ 2 ] ) );
  }

  public static applyCuePrograms(): void {
    Material.__cueMaterials.forEach( ( material ) => {
      material.applyCueProgram();
    } );
    Material.__cueMaterials.clear();
  }

  protected get __definesString(): string {
    return Object.entries( this.__defines ).map( ( [ key, value ] ) => (
      value ? `#define ${key} ${value}\n` : ''
    ) ).join( '' );
  }
}
