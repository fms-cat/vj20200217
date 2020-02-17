import { DISPLAY } from '../heck/DISPLAY';
import { EVENTMAN } from '../utils/EventManager';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';
import { loadImageTexture } from '../utils/loadImageTexture';

const textureLut = DISPLAY.glCat.createTexture();
textureLut.setZeroTexture();

async function prepareTextures(): Promise<void> {
  await loadImageTexture( {
    texture: textureLut,
    url: require( '../images/x-pro-ii.png' ).default
  } );
}
prepareTextures();
EVENTMAN.on( 'regenerate', () => prepareTextures() );

export interface PostOptions {
  input: GLCatTexture;
  target: RenderTarget;
}

export class Post {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: PostOptions ) {
    this.__entity = new Entity();

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/post.frag' ).default
    );
    material.addUniformTexture( 'sampler0', options.input );
    material.addUniformTexture( 'samplerLut', textureLut );

    if ( module.hot ) {
      module.hot.accept( '../shaders/post.frag', () => {
        material.cueShader(
          Shaders.quadVert,
          require( '../shaders/post.frag' ).default
        );
      } );
    }

    this.__entity.components.push( new Quad( {
      target: options.target,
      material
    } ) );
  }
}
