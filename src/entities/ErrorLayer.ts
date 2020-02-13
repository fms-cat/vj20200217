import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { Plane } from './Plane';

export class ErrorLayer {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  private __plane: Plane;

  public get plane(): Plane {
    return this.__plane;
  }

  private __time: number = 0.0;

  public get time(): number {
    return this.__time;
  }

  private __message: string | null = null;
  private __canvas: HTMLCanvasElement;
  private __context: CanvasRenderingContext2D;
  private __texture: GLCatTexture;

  public constructor() {
    this.__entity = new Entity();

    this.__canvas = document.createElement( 'canvas' );
    this.__canvas.width = 2048;
    this.__canvas.height = 1024;
    document.body.appendChild( this.__canvas );

    this.__context = this.__canvas.getContext( '2d' )!;

    this.__texture = DISPLAY.glCat.createTexture();
    this.__texture.setTexture( this.__canvas );

    this.__entity.components.push( new Lambda( ( event ) => {
      this.__draw( event.deltaTime );
    } ) );

    this.__plane = new Plane( {
      frag: require( '../shaders/errorlayer.frag' ).default
    } );
    this.__entity.children.push( this.__plane.entity );
    this.__plane.material.addUniformTexture( 'sampler0', this.__texture );
  }

  public setText( message: any | null ): void {
    this.__time = 0.0;
    this.__message = message !== null ? message.toString() : null;
  }

  private __draw( deltaTime: number ): void {
    this.__context.clearRect( 0, 0, this.__canvas.width, this.__canvas.height );

    if ( this.__message ) {
      this.__time += deltaTime;

      this.__context.textAlign = 'center';
      this.__context.textBaseline = 'middle';
      this.__context.font = '900 128px Yu Mincho';
      this.__context.fillStyle = '#ffffff';
      this.__context.fillText( '警告', 1024, 102.4 );

      this.__context.textAlign = 'left';
      this.__context.font = '500 40px "Lucida Console", monospace';
      this.__context.fillStyle = '#ffffff';
      const lines = this.__message.split( '\n' );
      lines.forEach( ( line, i ) => {
        this.__context.fillText( line, 64, 256 + i * 64 );
      } );
    }

    this.__texture.setTexture( this.__canvas );
    this.__plane.material.addUniform( 'errorTime', '1f', this.__time );
  }
}
