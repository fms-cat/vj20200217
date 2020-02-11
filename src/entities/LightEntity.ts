import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { Shaders } from '../shaders';
import { Swap } from '@fms-cat/experimental';

export interface LightEntityOptions {
  root: Entity;
  shadowMapFov?: number;
  shadowMapNear?: number;
  shadowMapFar?: number;
  shadowMapWidth?: number;
  shadowMapHeight?: number;
}

export class LightEntity {
  public color: [ number, number, number ] = [ 1.0, 1.0, 1.0 ];

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

    const swapOptions = {
      width: options.shadowMapWidth || 1024,
      height: options.shadowMapHeight || 1024
    };

    const swap = new Swap(
      new BufferRenderTarget( swapOptions ),
      new BufferRenderTarget( swapOptions )
    );

    // -- camera -----------------------------------------------------------------------------------
    const fov = options.shadowMapFov || 45.0;
    const near = options.shadowMapNear || 0.1;
    const far = options.shadowMapFar || 100.0;

    this.__shadowMapCamera = new PerspectiveCamera( {
      fov,
      near,
      far,
      renderTarget: swap.o,
      scene: this.__root
    } );
    this.__shadowMapCamera.clear = [ 1.0, 1.0, 1.0, 1.0 ];
    this.__entity.components.push( this.__shadowMapCamera );

    this.__shadowMap = new BufferRenderTarget( {
      width: options.shadowMapWidth || 1024,
      height: options.shadowMapHeight || 1024
    } );

    swap.swap();

    // -- convert ----------------------------------------------------------------------------------
    const materialConvert = new Material(
      Shaders.quadVert,
      Shaders.posToDepthFrag
    );
    materialConvert.addUniform( 'perspNearFar', '2f', near, far );
    materialConvert.addUniformTexture( 'sampler0', swap.i.texture );

    this.__entity.components.push( new Quad( {
      target: swap.o,
      material: materialConvert
    } ) );

    swap.swap();

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        Shaders.quadVert,
        Shaders.shadowBlurFrag
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.__entity.components.push( new Quad( {
        target: i === 0 ? swap.o : this.__shadowMap,
        material
      } ) );

      swap.swap();
    }
  }
}
