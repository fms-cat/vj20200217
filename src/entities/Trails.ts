import { GL, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { Shaders } from '../shaders';

export interface TrailsOptions {
  trails: number;
  trailLength: number;
  textureRandom: GLCatTexture;
  textureRandomStatic: GLCatTexture;
}

export class Trails {
  private static __ppp = 2;

  public get entity(): Entity {
    return this.__gpuParticles.entity;
  }

  private __gpuParticles: GPUParticles;

  public get materialCompute(): Material {
    return this.__gpuParticles.materialCompute;
  }

  public get materialRender(): Material {
    return this.__gpuParticles.materialRender;
  }

  public constructor( options: TrailsOptions ) {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: Trails.__ppp * options.trailLength,
      computeHeight: options.trails,
      computeNumBuffers: 1
    } );
  }

  private __createMaterialCompute( options: TrailsOptions ): Material {
    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/trails-compute.frag' ).default
    );
    material.addUniform( 'trails', '1f', options.trails );
    material.addUniform( 'trailLength', '1f', options.trailLength );
    material.addUniform( 'ppp', '1f', Trails.__ppp );
    material.addUniformTexture( 'samplerRandom', options.textureRandom );

    if ( module.hot ) {
      module.hot.accept( '../shaders/trails-compute.frag', () => {
        material.compileShaderAsync(
          Shaders.quadVert,
          require( '../shaders/trails-compute.frag' ).default,
          true,
          false,
          true
        );
      } );
    }

    return material;
  }

  private __createGeometryRender( options: TrailsOptions ): Geometry {
    const geometry = new InstancedGeometry();

    const bufferComputeU = DISPLAY.glCat.createBuffer();
    bufferComputeU.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.trailLength * 3 );
      for ( let i = 0; i < options.trailLength; i ++ ) {
        const u = ( Trails.__ppp * i + 0.5 ) / ( Trails.__ppp * options.trailLength );
        ret[ i * 3 + 0 ] = u;
        ret[ i * 3 + 1 ] = u;
        ret[ i * 3 + 2 ] = u;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeU', {
      buffer: bufferComputeU,
      size: 1,
      type: GL.FLOAT
    } );

    const bufferComputeV = DISPLAY.glCat.createBuffer();
    bufferComputeV.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.trails );
      for ( let i = 0; i < options.trails; i ++ ) {
        ret[ i ] = ( i + 0.5 ) / options.trails;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'computeV', {
      buffer: bufferComputeV,
      size: 1,
      divisor: 1,
      type: GL.FLOAT
    } );

    const bufferTriIndex = DISPLAY.glCat.createBuffer();
    bufferTriIndex.setVertexbuffer( ( () => {
      const ret = new Float32Array( 3 * options.trailLength );
      for ( let i = 0; i < options.trailLength; i ++ ) {
        ret[ i * 3 + 0 ] = 0;
        ret[ i * 3 + 1 ] = 1;
        ret[ i * 3 + 2 ] = 2;
      }
      return ret;
    } )() );

    geometry.addAttribute( 'triIndex', {
      buffer: bufferTriIndex,
      size: 1,
      type: GL.FLOAT
    } );

    const indexBuffer = DISPLAY.glCat.createBuffer();
    indexBuffer.setIndexbuffer( ( () => {
      const ret = new Uint16Array( ( options.trailLength - 1 ) * 18 );
      for ( let i = 0; i < options.trailLength - 1; i ++ ) {
        for ( let j = 0; j < 3; j ++ ) {
          const jn = ( j + 1 ) % 3;
          ret[ i * 18 + j * 6 + 0 ] = i * 3 + j;
          ret[ i * 18 + j * 6 + 1 ] = i * 3 + 3 + j;
          ret[ i * 18 + j * 6 + 2 ] = i * 3 + 3 + jn;
          ret[ i * 18 + j * 6 + 3 ] = i * 3 + j;
          ret[ i * 18 + j * 6 + 4 ] = i * 3 + 3 + jn;
          ret[ i * 18 + j * 6 + 5 ] = i * 3 + jn;
        }
      }
      return ret;
    } )() );

    geometry.setIndex( {
      buffer: indexBuffer,
      type: GL.UNSIGNED_SHORT
    } );

    geometry.count = ( options.trailLength - 1 ) * 18;
    geometry.primcount = options.trails;
    geometry.mode = GL.TRIANGLES;

    return geometry;
  }

  private __createMaterialRender( options: TrailsOptions ): Material {
    const material = new Material(
      require( '../shaders/trails-render.vert' ).default,
      require( '../shaders/trails-render.frag' ).default,
      {
        'USE_CLIP': 'true',
        'USE_VERTEX_COLOR': 'true'
      }
    );
    material.addUniform( 'colorVar', '1f', 0.1 );
    material.addUniform( 'ppp', '1f', Trails.__ppp );
    material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );

    if ( module.hot ) {
      module.hot.accept( '../shaders/trails-render.vert', () => {
        material.compileShaderAsync(
          require( '../shaders/trails-render.vert' ).default,
          require( '../shaders/trails-render.frag' ).default,
          true,
          true,
          false
        );
      } );
    }

    if ( module.hot ) {
      module.hot.accept( '../shaders/trails-render.frag', () => {
        material.compileShaderAsync(
          require( '../shaders/trails-render.vert' ).default,
          require( '../shaders/trails-render.frag' ).default,
          true,
          false,
          true
        );
      } );
    }

    return material;
  }
}
