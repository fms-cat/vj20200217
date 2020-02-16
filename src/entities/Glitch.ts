import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';

export interface GlitchOptions {
  input: GLCatTexture;
  target: RenderTarget;
}

export class Glitch {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  private __material: Material;

  public get material(): Material {
    return this.__material;
  }

  public constructor( options: GlitchOptions ) {
    this.__entity = new Entity();

    // -- quad -------------------------------------------------------------------------------------
    this.__material = new Material(
      Shaders.quadVert,
      require( '../shaders/glitch.frag' ).default
    );
    this.__material.addUniformTexture( 'sampler0', options.input );

    if ( module.hot ) {
      module.hot.accept( '../shaders/glitch.frag', () => {
        this.__material.cueShader(
          Shaders.quadVert,
          require( '../shaders/glitch.frag' ).default
        );
      } );
    }

    this.__entity.components.push( new Quad( {
      target: options.target,
      material: this.__material
    } ) );
  }
}
