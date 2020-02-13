import { BufferRenderTarget, BufferRenderTargetOptions } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { Swap } from '@fms-cat/experimental';

export interface GPUParticlesOptions {
  materialCompute: Material;
  geometryRender: Geometry;
  materialRender: Material;
  computeWidth: number;
  computeHeight: number;
  computeNumBuffers: number;
}

export class GPUParticles {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  private __swapCompute: Swap<BufferRenderTarget>;

  private __quadCompute: Quad;

  private __meshRender: Mesh;

  public get meshRender(): Mesh {
    return this.__meshRender;
  }

  public get materialCompute(): Material {
    return this.__quadCompute.material;
  }

  public get materialRender(): Material {
    return this.__meshRender.material;
  }

  public constructor( options: GPUParticlesOptions ) {
    this.__entity = new Entity();

    const brtOptions: BufferRenderTargetOptions = {
      width: options.computeWidth,
      height: options.computeHeight,
      numBuffers: options.computeNumBuffers
    };

    this.__swapCompute = new Swap(
      new BufferRenderTarget( brtOptions ),
      new BufferRenderTarget( brtOptions )
    );

    // -- swapper ----------------------------------------------------------------------------------
    this.__entity.components.push( new Lambda( () => {
      this.__swapCompute.swap();

      this.materialCompute.addUniformTexture( 'samplerCompute', this.__swapCompute.i.texture );
      this.__quadCompute.target = this.__swapCompute.o;
      this.materialRender.addUniformTexture( 'samplerCompute', this.__swapCompute.o.texture );
    } ) );

    // -- compute ----------------------------------------------------------------------------------
    this.__quadCompute = new Quad( {
      target: this.__swapCompute.o,
      material: options.materialCompute
    } );
    this.__entity.components.push( this.__quadCompute );

    // -- render -----------------------------------------------------------------------------------
    this.__meshRender = new Mesh(
      options.geometryRender,
      options.materialRender
    );
    options.materialRender.addUniform(
      'resolutionCompute',
      '2f',
      options.computeWidth,
      options.computeHeight
    );
    this.__entity.components.push( this.__meshRender );
  }
}
