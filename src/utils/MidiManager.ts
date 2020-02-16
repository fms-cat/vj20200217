import { lerp, saturate } from '@fms-cat/experimental';
import { EVENTMAN } from './EventManager';
import { EventEmittable } from './EventEmittable';

interface MidiManagerStorage {
  values: { [ key: string ]: number };
  noteMap: { [ note: number ]: string };
  ccMap: { [ cc: number ]: string };
  ccValues: number[];
}

class MidiManagerParam {
  public value: number = 0.0;
  public rawValue: number = 0.0;
  public smoothFactor: number = 1E9;

  public update( deltaTime: number ): void {
    this.value = lerp(
      this.rawValue,
      this.value,
      Math.exp( -deltaTime * this.smoothFactor )
    );
  }
}

interface MidiManagerEvents {
  noteOn: { note: number; velocity: number };
  noteOff: { note: number; velocity: number };
  ccChange: { cc: number; value: number };
  paramChange: { key: string; value: number };
}

export class MidiManager extends EventEmittable<MidiManagerEvents> {
  private __params: { [ key: string ]: MidiManagerParam } = {};

  public get params(): { [ key: string ]: MidiManagerParam } {
    return this.__params;
  }

  private __ccValues: number[];

  public get ccValues(): number[] {
    return this.__ccValues;
  }

  private __lastCC: number | null = null;
  private __noteMap: { [ note: number ]: string };
  private __ccMap: { [ cc: number ]: string };
  private __dom?: HTMLElement;
  private __storage: MidiManagerStorage;
  private __learningParam: string | null = null;

  public constructor() {
    super();

    this.__storage = this.__loadStorage();
    this.__noteMap = this.__storage.noteMap;
    this.__ccMap = this.__storage.ccMap;
    this.__ccValues = this.__storage.ccValues;
  }

  public midi( key: string ): number {
    if ( !this.__params[ key ] ) {
      this.__createParam( key );
    }

    return this.__params[ key ].value;
  }

  public setSmoothFactor( key: string, smoothFactor: number ): void {
    if ( !this.__params[ key ] ) {
      this.__createParam( key );
    }

    this.__params[ key ].smoothFactor = smoothFactor;
  }

  public async initMidi(): Promise<void> {
    const access = await navigator.requestMIDIAccess();
    const inputs = access.inputs;
    Array.from( inputs.values() ).forEach( ( input ) => {
      input.addEventListener(
        'midimessage',
        ( event ) => this.__handleMidiMessage( event )
      );

      EVENTMAN.emitInfo( `Detected MIDI Device: ${ input.name }` );
    } );
  }

  public attachDOM( dom: HTMLElement ): void {
    this.__dom = dom;
    this.__updateDOM();
  }

  public learn( key: string ): void {
    this.__learningParam = key;
    this.__updateDOM();
  }

  public update( deltaTime: number = 1.0 / 60.0 ): void {
    Object.values( this.__params ).forEach( ( param ) => {
      param.update( deltaTime );
    } );
  }

  public setValue( key: string, value: number ): void {
    if ( !this.__params[ key ] ) { return; }

    this.__params[ key ].rawValue = value;
    this.__storage.values[ key ] = value;
    this.__writeStorage();
  }

  private __loadStorage(): MidiManagerStorage {
    return localStorage.midiManager
      ? JSON.parse( localStorage.midiManager )
      : { values: {}, noteMap: {}, ccMap: {}, ccValues: new Array( 128 ).fill( 0 ) };
  }

  private __writeStorage(): void {
    localStorage.midiManager = JSON.stringify( this.__storage );
  }

  private __createParam( key: string ): void {
    this.__params[ key ] = new MidiManagerParam();
    this.__params[ key ].rawValue = this.__storage.values[ key ] || 0.0;
    this.__params[ key ].value = this.__params[ key ].rawValue;
    this.__updateDOM();
  }

  private __changeValue( key: string, value: number ): void {
    this.__params[ key ].rawValue = value;

    this.__emit( 'paramChange', {
      key,
      value
    } );

    this.__storage.values[ key ] = value;
    this.__writeStorage();
  }

  private __handleMidiMessage( event: WebMidi.MIDIMessageEvent ): void {
    let paramKey = '';
    let value = 0;

    if ( event.data && event.data[ 0 ] === 128 || event.data[ 0 ] === 144 ) { // channel 0, note on / off
      if ( this.__learningParam ) {
        this.__noteMap[ event.data[ 1 ] ] = this.__learningParam;
        this.__storage.noteMap[ event.data[ 1 ] ] = this.__learningParam;
        this.__writeStorage();
        this.__learningParam = '';
      }

      paramKey = this.__noteMap[ event.data[ 1 ] ];
      value = event.data[ 0 ] === 128 ? 0.0 : event.data[ 2 ] / 127.0;

      this.__emit( event.data[ 0 ] === 128 ? 'noteOff' : 'noteOn', {
        note: event.data[ 1 ],
        velocity: event.data[ 2 ] / 127.0
      } );

    } else if ( event.data && event.data[ 0 ] === 176 ) { // channel 0, control changes
      if ( this.__learningParam ) {
        this.__ccMap[ event.data[ 1 ] ] = this.__learningParam;
        this.__storage.ccMap[ event.data[ 1 ] ] = this.__learningParam;
        this.__writeStorage();
        this.__learningParam = '';
      }

      paramKey = this.__ccMap[ event.data[ 1 ] ];
      value = event.data[ 2 ] / 127.0;

      this.__ccValues[ event.data[ 1 ] ] = event.data[ 2 ] / 127.0;
      this.__storage.ccValues[ event.data[ 1 ] ] = event.data[ 2 ] / 127.0;
      this.__writeStorage();

      this.__lastCC = event.data[ 1 ];

      this.__emit( 'ccChange', {
        cc: event.data[ 1 ],
        value: event.data[ 2 ] / 127.0
      } );
    }

    if ( paramKey ) {
      this.__changeValue( paramKey, value );
    }

    this.__updateDOM();
  }

  private __handleWheel( key: string, event: WheelEvent ): void {
    const param = this.__params[ key ]!;
    let delta = 0.001 * event.deltaY;
    if ( event.altKey ) {
      delta *= 0.1;
    }

    this.__changeValue(
      key,
      saturate( param.rawValue - delta )
    );
    this.__updateDOM();
  }

  private __updateDOM(): void {
    const dom = this.__dom;
    if ( !dom ) { return; }

    Object.keys( this.__params ).forEach( ( key ) => {
      let domParam = dom.querySelector( `.${ key }` ) as HTMLDivElement;
      if ( !domParam ) {
        domParam = document.createElement( 'div' ) as HTMLDivElement;
        domParam.className = key;
        domParam.onclick = () => this.learn( key );
        domParam.onwheel = ( event ) => this.__handleWheel( key, event );

        // dict
        const done = Array.from( dom.childNodes ).some( ( _child ) => {
          const child = _child as HTMLDivElement;
          if ( child.className && key < child.className ) {
            dom.insertBefore( domParam, child );
            return true;
          }
          return false;
        } );
        if ( !done ) {
          dom.appendChild( domParam );
        }
      }

      domParam.innerText = `${ key }: ${ this.__params[ key ].rawValue.toFixed( 3 ) }`;
      domParam.style.color = key === this.__learningParam ? '#0f0' : '';
    } );

    let domLastCC = dom.querySelector( '.__lastCC' ) as HTMLDivElement;
    if ( !domLastCC ) {
      domLastCC = document.createElement( 'div' ) as HTMLDivElement;
      domLastCC.className = '__lastCC';
      dom.appendChild( domLastCC );
    }

    domLastCC.innerText = `Last CC: ${ this.__lastCC }`;
  }
}

export const MIDIMAN = new MidiManager();
MIDIMAN.initMidi();

const el = document.getElementById( 'divMidi' );
if ( el ) {
  MIDIMAN.attachDOM( el );
}
