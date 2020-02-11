import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';

export class Invert {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  private __material: Material;

  public get material(): Material {
    return this.__material;
  }

  public constructor( input: GLCatTexture, target: RenderTarget ) {
    this.__entity = new Entity();

    this.__material = new Material(
      Shaders.quadVert,
      Shaders.invertFrag
    );
    this.__material.addUniformTexture( 'sampler0', input );

    const quad = new Quad( {
      target: target,
      material: this.__material
    } );
    this.__entity.components.push( quad );
  }
}
