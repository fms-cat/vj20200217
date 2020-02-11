import { Component, ComponentUpdateEvent } from './Component';

export class LogTransform extends Component {
  protected __updateImpl( event: ComponentUpdateEvent ): void {
    console.info( `
Position: ${ event.globalTransform.position }
Rotation: ${ event.globalTransform.rotation }
Scale: ${ event.globalTransform.scale }
Matrix: ${ event.globalTransform.matrix }
` );
  }
}
