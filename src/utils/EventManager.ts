import { EventEmittable } from './EventEmittable';

export class EventManager extends EventEmittable<{
  error: any;
  info: string;
  words: string[];
  panic: void;
  regenerate: void;
}> {
  public emitError( e: any ): void {
    this.__emit( 'error', e );
  }

  public emitInfo( e: string ): void {
    this.__emit( 'info', e );
  }

  public emitWords( e: string[] ): void {
    this.__emit( 'words', e );
  }

  public emitPanic(): void {
    this.__emit( 'panic' );
  }

  public emitRegenerate(): void {
    this.__emit( 'regenerate' );
  }
}

export const EVENTMAN = new EventManager();
