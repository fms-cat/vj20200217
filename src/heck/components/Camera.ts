import { Component, ComponentUpdateEvent } from './Component';
import { DISPLAY } from '../DISPLAY';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';

export interface CameraOptions {
  renderTarget?: RenderTarget;
  projectionMatrix: Matrix4;
  scene?: Entity;
  clear?: Array<number | undefined> | false;
}

export abstract class Camera extends Component {
  protected __projectionMatrix: Matrix4;

  public get projectionMatrix(): Matrix4 {
    return this.__projectionMatrix;
  }

  public renderTarget?: RenderTarget;

  public scene?: Entity;

  public clear: Array<number | undefined> | false = [];

  public abstract get near(): number;

  public abstract get far(): number;

  public constructor( options: CameraOptions ) {
    super();

    this.renderTarget = options.renderTarget;
    this.scene = options.scene;
    this.__projectionMatrix = options.projectionMatrix;
    if ( options.clear !== undefined ) { this.clear = options.clear; }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    if ( !this.renderTarget ) {
      throw new Error( 'You must assign a renderTarget to the Camera' );
    }

    if ( !this.scene ) {
      throw new Error( 'You must assign a scene to the Camera' );
    }

    const viewMatrix = event.globalTransform.matrix.inverse!;

    this.renderTarget.bind();

    if ( this.clear ) {
      DISPLAY.glCat.clear( ...this.clear );
    }

    this.scene.draw( {
      frameCount: event.frameCount,
      time: event.time,
      renderTarget: this.renderTarget,
      globalTransform: new Transform(),
      viewMatrix,
      projectionMatrix: this.__projectionMatrix,
      camera: this
    } );
  }
}
