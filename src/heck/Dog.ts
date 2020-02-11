import { Clock, ClockRealtime } from '@fms-cat/experimental';
import { Entity } from './Entity';
import { Transform } from './Transform';

export interface DogOptions {
  clock: Clock;
  root: Entity;
}

const defaultDogOptions: DogOptions = {
  clock: new ClockRealtime(),
  root: new Entity()
};

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: Entity;
  public clock: Clock = new Clock();
  public active: boolean = true;

  private __frameCount: number = 0;

  public constructor( options: DogOptions = defaultDogOptions ) {
    this.root = options.root;
    this.clock = options.clock;

    const update = (): void => {
      if ( this.active ) {
        this.clock.update();
        this.root.update( {
          frameCount: this.__frameCount ++,
          time: this.clock.time,
          deltaTime: this.clock.deltaTime,
          globalTransform: new Transform(),
          parent: null
        } );
      }

      requestAnimationFrame( update );
    };
    update();
  }
}
