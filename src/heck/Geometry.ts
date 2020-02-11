import { GL, GLCatBuffer } from '@fms-cat/glcat-ts';
import { DISPLAY } from './DISPLAY';
import { Material } from './Material';

export interface GeometryAttribute {
  buffer: GLCatBuffer;
  size: number;
  divisor?: number;
  type: GLenum;
  stride?: number;
  offset?: number;
}

export interface GeometryIndex {
  buffer: GLCatBuffer;
  type: GLenum;
}

export class Geometry {
  protected static __typeSizeMap = {
    [ GL.UNSIGNED_BYTE ]: 1,
    [ GL.UNSIGNED_SHORT ]: 2,
    [ GL.UNSIGNED_INT ]: 4
  };

  protected __attributes: {
    [ name: string ]: GeometryAttribute;
  } = {};
  protected __index: GeometryIndex | null = null;

  public mode: GLenum = GL.TRIANGLES;
  public first = 0;
  public count = 0;
  public primcount: number | null = null;

  public addAttribute( name: string, attribute: GeometryAttribute ): void {
    this.__attributes[ name ] = attribute;
  }

  public removeAttribute( name: string, alsoDisposeBuffer = true ): void {
    if ( alsoDisposeBuffer ) {
      this.__attributes[ name ].buffer.dispose();
    }

    delete this.__attributes[ name ];
  }

  public setIndex( index: GeometryIndex | null ): void {
    this.__index = index;
  }

  public assignBuffers( material: Material ): void {
    const program = material.program;

    Object.entries( this.__attributes ).forEach( ( [ name, attr ] ) => {
      program.attribute(
        name,
        attr.buffer,
        attr.size,
        attr.divisor,
        attr.type,
        attr.stride,
        attr.offset
      );
    } );
  }

  public draw(): void {
    const gl = DISPLAY.glCat.renderingContext;

    if ( this.count === 0 ) {
      console.warn( 'You attempt to draw a geometry that count is 0' );
      return;
    }

    if ( this.__index ) {
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.__index.buffer.raw );
      gl.drawElements(
        this.mode,
        this.count,
        this.__index.type,
        this.first * Geometry.__typeSizeMap[ this.__index.type ]
      );
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } else {
      gl.drawArrays( this.mode, this.first, this.count );
    }
  }

  public disposeBuffers(): void {
    Object.values( this.__attributes ).forEach( ( attr ) => {
      attr.buffer.dispose();
    } );
  }
}
