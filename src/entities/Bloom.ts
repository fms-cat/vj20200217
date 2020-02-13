import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';
import { Swap } from '@fms-cat/experimental';

export interface BloomOptions {
  input: GLCatTexture;
  target: RenderTarget;
}

export class Bloom {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: BloomOptions ) {
    this.__entity = new Entity();

    const swap = new Swap(
      new BufferRenderTarget( { width: options.target.width, height: options.target.height } ),
      new BufferRenderTarget( { width: options.target.width, height: options.target.height } )
    );

    // -- pre ----------------------------------------------------------------------------------------
    const materialBloomPre = new Material(
      Shaders.quadVert,
      Shaders.bloomPreFrag
    );
    materialBloomPre.addUniformTexture( 'sampler0', options.input );

    this.__entity.components.push( new Quad( {
      target: swap.o,
      material: materialBloomPre,
      range: [ -1.0, -1.0, 0.0, 0.0 ]
    } ) );

    swap.swap();

    // -- dup ----------------------------------------------------------------------------------------
    for ( let i = 0; i < 6; i ++ ) {
      const material = new Material(
        Shaders.quadVert,
        Shaders.returnFrag
      );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.__entity.components.push( new Quad( {
        target: swap.o,
        material,
        range: i === 0 ? [ -1.0, -1.0, 1.0, 1.0 ] : [ 0.0, 0.0, 1.0, 1.0 ]
      } ) );

      swap.swap();
    }

    // -- blur ---------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        Shaders.quadVert,
        Shaders.bloomBlurFrag
      );
      material.addUniform( 'isVert', '1i', i );
      material.addUniformTexture( 'sampler0', swap.i.texture );

      this.__entity.components.push( new Quad( {
        target: swap.o,
        material
      } ) );

      swap.swap();
    }

    // -- post ---------------------------------------------------------------------------------------
    const materialBloomPost = new Material(
      Shaders.quadVert,
      Shaders.bloomPostFrag
    );
    materialBloomPost.addUniformTexture( 'samplerDry', options.input );
    materialBloomPost.addUniformTexture( 'samplerWet', swap.i.texture );

    this.__entity.components.push( new Quad( {
      target: options.target,
      material: materialBloomPost
    } ) );
  }
}
