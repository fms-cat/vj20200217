import { Camera } from './Camera';
import { Entity } from '../Entity';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  entity: Entity;
}

export interface ComponentDrawEvent {
  frameCount: number;
  time: number;
  camera: Camera;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  entity: Entity;
}

export class Component {
  protected __lastUpdateFrame = 0;

  public active = true;
  public visible = true;

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.__lastUpdateFrame === event.frameCount ) { return; }
    this.__lastUpdateFrame = event.frameCount;
    this.__updateImpl( event );
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void { // eslint-disable-line
    // do nothing
  }

  public draw( event: ComponentDrawEvent ): void {
    if ( !this.visible ) { return; }
    this.__drawImpl( event );
  }

  protected __drawImpl( event: ComponentDrawEvent ): void { // eslint-disable-line
    // do nothing
  }
}
