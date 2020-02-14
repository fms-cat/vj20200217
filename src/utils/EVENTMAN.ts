import { EventEmittable } from './EventEmittable';

export class EventManager extends EventEmittable<{
  error: any;
  info: string;
  words: string[];
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
}

export const EVENTMAN = new EventManager();
