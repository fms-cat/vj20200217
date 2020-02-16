import { Component, ComponentDrawEvent } from './Component';

export class DrawLambda extends Component {
  public onDraw?: ( event: ComponentDrawEvent ) => void;

  public constructor( onDraw?: ( event: ComponentDrawEvent ) => void ) {
    super();
    this.onDraw = onDraw;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    this.onDraw && this.onDraw( event );
  }
}
