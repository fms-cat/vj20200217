import { EventEmittable } from './EventEmittable';

export class ErrorManager extends EventEmittable<{
  error: any;
}> {
  public emit( e: any ): void {
    this.__emit( 'error', e );
  }
}

export const ERRORMAN = new ErrorManager();
