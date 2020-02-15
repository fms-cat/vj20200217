import { GL, GLCatTexture } from '@fms-cat/glcat-ts';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';

export class BigWords {
  private __canvas: HTMLCanvasElement;
  private __context: CanvasRenderingContext2D;

  private __entity: Entity;

  private __texture: GLCatTexture;

  public words: Set<string> = new Set();

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: {
    target: RenderTarget;
    width: number;
    height: number;
  } ) {
    const { target, width, height } = options;

    this.__entity = new Entity();

    // -- canvas -----------------------------------------------------------------------------------
    this.__canvas = document.createElement( 'canvas' );
    this.__canvas.width = width;
    this.__canvas.height = height;

    this.__context = this.__canvas.getContext( '2d' )!;

    // -- quad -------------------------------------------------------------------------------------
    this.__texture = DISPLAY.glCat.createTexture();
    this.__texture.setZeroTexture();

    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/bigword.frag' ).default
    );
    material.blend = [ GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA ];
    material.addUniformTexture( 'sampler0', this.__texture );

    if ( module.hot ) {
      module.hot.accept( '../shaders/bigword.frag', () => {
        material.compileShaderAsync(
          Shaders.quadVert,
          require( '../shaders/bigword.frag' ).default
        );
      } );
    }

    const quad = new Quad( {
      material,
      target
    } );
    this.__entity.components.push( quad );
  }

  public draw(): void {
    const { width, height } = this.__canvas;

    this.__context.clearRect( 0, 0, width, height );

    this.__context.textAlign = 'left';
    this.__context.textBaseline = 'middle';
    this.__context.font = `100 ${ height * 0.6 }px "Helvetica Now Display"`;
    this.__context.fillStyle = '#ffffff';
    this.__context.fillText( this.__getRandomWord(), -0.05 * width, 0.17 * height );

    this.__context.textAlign = 'right';
    this.__context.textBaseline = 'middle';
    this.__context.font = `700 ${ height * 0.6 }px "Helvetica Now Display"`;
    this.__context.fillStyle = '#ffffff';
    this.__context.fillText( this.__getRandomWord(), 1.05 * width, 0.8 * height );

    this.__texture.setTexture( this.__canvas );
  }

  private __getRandomWord(): string {
    const arr = Array.from( this.words );

    if ( arr.length === 0 ) { return 'New Text'; }
    return arr[ Math.floor( Math.random() * arr.length ) ];
  }
}
