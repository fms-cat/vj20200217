import { Component, ComponentUpdateEvent } from './Component';

export class Lambda extends Component {
  public onUpdate?: ( event: ComponentUpdateEvent ) => void;

  public constructor( onUpdate?: ( event: ComponentUpdateEvent ) => void ) {
    super();
    this.onUpdate = onUpdate;
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.onUpdate && this.onUpdate( event );
  }
}
