import { GL, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GPUParticles } from './GPUParticles';
import { Geometry } from '../heck/Geometry';
import { InstancedGeometry } from '../heck/InstancedGeometry';
import { Material } from '../heck/Material';
import { Shaders } from '../shaders';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { loadImageTexture } from '../utils/loadImageTexture';

const textureMissing = loadImageTexture( require( '../images/missing.png' ).default );

export interface UIParticlesOptions {
  particlesSqrt: number;
  textureRandom: GLCatTexture;
  textureRandomStatic: GLCatTexture;
}

export class UIParticles {
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

  public constructor( options: UIParticlesOptions ) {
    this.__gpuParticles = new GPUParticles( {
      materialCompute: this.__createMaterialCompute( options ),
      geometryRender: this.__createGeometryRender( options ),
      materialRender: this.__createMaterialRender( options ),
      computeWidth: UIParticles.__ppp * options.particlesSqrt,
      computeHeight: options.particlesSqrt,
      computeNumBuffers: 1
    } );
  }

  private __createMaterialCompute( options: UIParticlesOptions ): Material {
    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/ui-particles-compute.frag' ).default
    );
    material.addUniform( 'particlesSqrt', '1f', options.particlesSqrt );
    material.addUniform( 'particles', '1f', options.particlesSqrt * options.particlesSqrt );
    material.addUniform( 'ppp', '1f', UIParticles.__ppp );
    material.addUniformTexture( 'samplerRandom', options.textureRandom );

    if ( module.hot ) {
      module.hot.accept( '../shaders/ui-particles-compute.frag', () => {
        material.compileShaderAsync(
          Shaders.quadVert,
          require( '../shaders/ui-particles-compute.frag' ).default,
          true,
          false,
          true
        ).catch( ( e ) => {
          console.error( e );
        } );
      } );
    }

    return material;
  }

  private __createGeometryRender( options: UIParticlesOptions ): Geometry {
    const geometry = new InstancedGeometry();

    const bufferComputeUV = DISPLAY.glCat.createBuffer();
    bufferComputeUV.setVertexbuffer( ( () => {
      const ret = new Float32Array( options.particlesSqrt * options.particlesSqrt * 2 );
      for ( let iy = 0; iy < options.particlesSqrt; iy ++ ) {
        for ( let ix = 0; ix < options.particlesSqrt; ix ++ ) {
          const i = ix + iy * options.particlesSqrt;
          const s = ( UIParticles.__ppp * ix + 0.5 )
            / ( UIParticles.__ppp * options.particlesSqrt );
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

  private __createMaterialRender( options: UIParticlesOptions ): Material {
    const material = new Material(
      Shaders.uiParticlesRenderVert,
      Shaders.uiParticlesRenderFrag,
      {
        'USE_CLIP': 'true',
        'USE_VERTEX_COLOR': 'true'
      }
    );
    material.addUniform( 'ppp', '1f', UIParticles.__ppp );
    material.addUniformTexture( 'samplerRandomStatic', options.textureRandomStatic );
    material.addUniformTexture( 'samplerDoublequoteRandom', textureMissing );

    return material;
  }
}
