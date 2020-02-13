// yoinked from https://github.com/mapbox/tiny-sdf (BSD 2-Clause)
// implements http://people.cs.uchicago.edu/~pff/papers/dt.pdf

const HUGE = 1E20;

export function edt1d(
  data: Float32Array,
  offset: number,
  stride: number,
  length: number
): void {
  // index of rightmost parabola in lower envelope
  let k = 0;

  // locations of parabolas in lower envelope
  const v = new Float32Array( length );
  v[ 0 ] = 0.0;

  // locations of boundaries between parabolas
  const z = new Float32Array( length + 1 );
  z[ 0 ] = -HUGE;
  z[ 1 ] = HUGE;

  // create a straight array of input data
  const f = new Float32Array( length );
  for ( let q = 0; q < length; q ++ ) {
    f[ q ] = data[ offset + q * stride ];
  }

  // compute lower envelope
  for ( let q = 1; q < length; q ++ ) {
    let s = 0.0;

    while ( 0 <= k ) {
      s = ( f[ q ] + q * q - f[ v[ k ] ] - v[ k ] * v[ k ] ) / ( 2.0 * q - 2.0 * v[ k ] );
      if ( s <= z[ k ] ) {
        k --;
      } else {
        break;
      }
    }

    k ++;
    v[ k ] = q;
    z[ k ] = s;
    z[ k + 1 ] = HUGE;
  }

  k = 0;

  // fill in values of distance transform
  for ( let q = 0; q < length; q ++ ) {
    while ( z[ k + 1 ] < q ) { k ++; }
    const qSubVK = q - v[ k ];
    data[ offset + q * stride ] = f[ v[ k ] ] + qSubVK * qSubVK;
  }
}

export function edt2d(
  data: Float32Array,
  width: number,
  height: number
): void {
  for ( let x = 0; x < width; x ++ ) {
    edt1d( data, x, width, height );
  }

  for ( let y = 0; y < height; y ++ ) {
    edt1d( data, y * width, 1, width );
  }
}
