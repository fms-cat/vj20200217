import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';

export interface FXAAOptions {
  input: GLCatTexture;
  target: RenderTarget;
}

export class FXAA {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: FXAAOptions ) {
    this.__entity = new Entity();

    // -- fxaa -------------------------------------------------------------------------------------
    const materialBloomPre = new Material(
      Shaders.quadVert,
      require( '../shaders/fxaa.frag' ).default
    );
    materialBloomPre.addUniformTexture( 'sampler0', options.input );

    this.__entity.components.push( new Quad( {
      target: options.target,
      material: materialBloomPre
    } ) );
  }
}
