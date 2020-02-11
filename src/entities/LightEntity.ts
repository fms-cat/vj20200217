import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { Shaders } from '../shaders';

export interface LightEntityOptions {
  root: Entity;
  shadowMapWidth?: number;
  shadowMapHeight?: number;
}

export class LightEntity {
  private __root: Entity;

  public get root(): Entity {
    return this.__root;
  }

  private __shadowMapCamera: PerspectiveCamera;

  public get camera(): PerspectiveCamera {
    return this.__shadowMapCamera;
  }

  private __shadowMap: BufferRenderTarget;

  public get shadowMap(): BufferRenderTarget {
    return this.__shadowMap;
  }

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: LightEntityOptions ) {
    this.__root = options.root;

    this.__entity = new Entity();

    const targetCamera = new BufferRenderTarget( {
      width: options.shadowMapWidth || 1024,
      height: options.shadowMapHeight || 1024
    } );

    const targetBlurH = new BufferRenderTarget( {
      width: targetCamera.width,
      height: targetCamera.height
    } );

    // -- camera -----------------------------------------------------------------------------------
    this.__shadowMapCamera = new PerspectiveCamera( {
      fov: 45.0,
      far: 40.0,
      renderTarget: targetCamera,
      scene: this.__root
    } );
    this.__shadowMapCamera.clear = [ 1.0, 1.0, 1.0, 1.0 ];
    this.__shadowMapCamera.fragmentOverride = Shaders.depthFrag;
    this.__entity.components.push( this.__shadowMapCamera );

    this.__shadowMap = new BufferRenderTarget( {
      width: options.shadowMapWidth || 1024,
      height: options.shadowMapHeight || 1024
    } );

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        Shaders.quadVert,
        Shaders.shadowBlurFrag
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', i === 0 ? targetCamera.texture : targetBlurH.texture );

      this.__entity.components.push( new Quad( {
        target: i === 0 ? targetBlurH : this.__shadowMap,
        material
      } ) );
    }
  }
}
