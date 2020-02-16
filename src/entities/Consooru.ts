import { GL, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { EVENTMAN } from '../utils/EventManager';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { MeshCull } from '../heck/components/Mesh';
import { Shaders } from '../shaders';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { createFontSpritesheetSDF } from '../utils/createFontSpritesheetSDF';

const textureChar = DISPLAY.glCat.createTexture();
textureChar.setZeroTexture();

async function prepareTextures(): Promise<void> {
  createFontSpritesheetSDF( {
    texture: textureChar,
    charSize: [ 64, 64 ],
    font: '700 48px "Wt-Position-Mono"',
  } );
}
prepareTextures();
EVENTMAN.on( 'regenerate', () => prepareTextures() );

export interface ConsooruOptions {
  particlesSqrt: number;
  textureRandom: GLCatTexture;
  textureRandomStatic: GLCatTexture;
}

export class Consooru {
  private static __ppp = 2;

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public linebreakDelay = 0.2;

  private __linebreakTime = 99999.0;

  private __gpuParticles: GPUParticles;

  private __particles: number;

  public get materialCompute(): Material {
    return this.__gpuParticles.materialCompute;
  }

  public get materialRender(): Material {
    return this.__gpuParticles.materialRender;
  }

  private __head: number = 0;
  private __position: number = 0;
  private __charCue: Array<{ code: number; mode: number }> = [];

  public constructor( options: ConsooruOptions ) {
    const { particlesSqrt } = options;
    this.__particles = particlesSqrt * particlesSqrt;

    this.__entity = new Entity();

    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: Consooru.__ppp * options.particlesSqrt,
      computeHeight: options.particlesSqrt,
      computeNumBuffers: 1
    } );
    this.__gpuParticles.meshRender.cull = MeshCull.None;
    this.__entity.children.push( this.__gpuParticles.entity );

    this.__entity.components.push( new Lambda( ( event ) => {
      this.__update( event.deltaTime );
    } ) );
  }

  public error( text: string ): void {
    this.push( '[ERRR] ', 1 );
    this.push( text, 0, false );
  }

  public warn( text: string ): void {
    this.push( '[WARN] ', 2 );
    this.push( text, 0, false );
  }

  public info( text: string ): void {
    this.push( '[INFO] ', 3 );
    this.push( text, 0, false );
  }

  public verbose( text: string ): void {
    this.push( '[VERB] ', 4 );
    this.push( text, 0, false );
  }

  public push( text: string, mode: number = 0, linebreak = true ): void {
    if ( linebreak ) {
      this.__charCue.push( { code: 10, mode } );
    }

    Array.from( text ).forEach( ( char ) => {
      this.__charCue.push( { code: char.charCodeAt( 0 ), mode } );
    } );
  }

  private __update( deltaTime: number ): void {
    this.__linebreakTime += deltaTime;
    this.__gpuParticles.materialCompute.addUniform(
      'linebreakTime',
      '1f',
      this.__linebreakTime
    );

    if ( this.__charCue.length > 0 && this.__linebreakTime > this.linebreakDelay ) {
      const { code, mode } = this.__charCue.shift()!;

      if ( code === 10 ) {
        this.__gpuParticles.materialCompute.addUniform(
          'newChar',
          '4f',
          0.0,
          0.0,
          0.0,
          0.0
        );

        this.__position = 0;
        this.__linebreakTime = 0.0;
      } else {
        this.__gpuParticles.materialCompute.addUniform(
          'newChar',
          '4f',
          code,
          mode,
          this.__position,
          this.__head / this.__particles
        );

        this.__position ++;
        this.__head = ( this.__head + 1 ) % this.__particles;
      }
    } else {
      this.__gpuParticles.materialCompute.addUniform(
        'newChar',
        '4f',
        0.0,
        0.0,
        0.0,
        0.0
      );
    }
  }

  private __createMaterialCompute( options: ConsooruOptions ): Material {
    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/consooru-compute.frag' ).default
    );
    material.addUniform( 'particlesSqrt', '1f', options.particlesSqrt );
    material.addUniform( 'particles', '1f', options.particlesSqrt * options.particlesSqrt );
    material.addUniform( 'ppp', '1f', Consooru.__ppp );
    material.addUniformTexture( 'samplerRandom', options.textureRandom );

    if ( module.hot ) {
      module.hot.accept( '../shaders/consooru-compute.frag', () => {
        material.cueShader(
          Shaders.quadVert,
          require( '../shaders/consooru-compute.frag' ).default
        );
      } );
    }

    return material;
  }

  private __createGeometryRender( options: ConsooruOptions ): Geometry {
    const geometry = new InstancedGeometry();

    const bufferComputeUV = DISPLAY.glCat.createBuffer();
    bufferComputeUV.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.particlesSqrt * options.particlesSqrt * 2 );
      for ( let iy = 0; iy < options.particlesSqrt; iy ++ ) {
        for ( let ix = 0; ix < options.particlesSqrt; ix ++ ) {
          const i = ix + iy * options.particlesSqrt;
          const s = ( Consooru.__ppp * ix + 0.5 )
            / ( Consooru.__ppp * options.particlesSqrt );
          const t = ( iy + 0.5 )
            / ( options.particlesSqrt );
          ret[ i * 2 + 0 ] = s;
          ret[ i * 2 + 1 ] = t;
        }
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeUV', {
      buffer: bufferComputeUV,
      size: 2,
      divisor: 1,
      type: GL.FLOAT
    } );

    const bufferP = DISPLAY.glCat.createBuffer();
    bufferP.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    geometry.addAttribute( 'p', {
      buffer: bufferP,
      size: 2,
      type: GL.FLOAT
    } );

    geometry.count = 4;
    geometry.primcount = options.particlesSqrt * options.particlesSqrt;
    geometry.mode = GL.TRIANGLE_STRIP;

    return geometry;
  }

  private __createMaterialRender( options: ConsooruOptions ): Material {
    const material = new Material(
      require( '../shaders/consooru-render.vert' ).default,
      require( '../shaders/consooru-render.frag' ).default,
      {
        'USE_CLIP': 'true',
        'USE_VERTEX_COLOR': 'true'
      }
    );
    material.addUniform( 'ppp', '1f', Consooru.__ppp );
    material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );
    material.addUniformTexture( 'samplerChar', textureChar );

    if ( module.hot ) {
      module.hot.accept( '../shaders/consooru-render.vert', () => {
        material.cueShader(
          require( '../shaders/consooru-render.vert' ).default,
          require( '../shaders/consooru-render.frag' ).default
        );
      } );

      module.hot.accept( '../shaders/consooru-render.frag', () => {
        material.cueShader(
          require( '../shaders/consooru-render.vert' ).default,
          require( '../shaders/consooru-render.frag' ).default
        );
      } );
    }

    return material;
  }
}
