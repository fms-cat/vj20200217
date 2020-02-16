#define BARREL_ITER 10

#define HUGE 9E16
#define PI 3.14159265
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))

// ------

precision highp float;

varying vec2 vUv;

uniform float time;
uniform vec2 resolution;
uniform float sirGlitch;
uniform float midiCC[ 128 ];

uniform float barrelAmp;
uniform float barrelOffset;

uniform sampler2D sampler0;

// == common =======================================================================================
float fractSin( float v ) {
  return fract( 17.351 * sin( 27.119 * v ) );
}

// == glitch =======================================================================================
vec2 displace( vec2 uv, float threshold ) {
  float seed = fractSin( lofi( uv.y, 0.125 ) + fractSin( lofi( uv.x, 0.25 ) ) );
  if ( seed < threshold ) { return vec2( 0.0 ); }

  vec2 d = vec2( 0.0 );
  seed = fractSin( seed );
  d.x = seed - 0.5;

  return d;
}

// == fetch ========================================================================================
vec4 fetch( vec2 uv ) {
  vec2 uvt = saturate( uv );
  vec4 color = texture2D( sampler0, uvt );
  return color;
}

// == main procedure ===============================================================================
void main() {
  vec2 uv = vUv.xy;

  vec2 d = vec2( 0.0 );
  for ( int i = 0; i < 3; i ++ ) {
    float p = pow( 2.4, float( i ) );
    float thr = 1.0 - pow( midiCC[ 84 ], 6.0 ) - sirGlitch;
    thr = thr * pow( thr, float( i ) );
    d += displace( uv * p + 50.0 * fractSin( 0.1 * time ), thr ) * 0.4 / p;
  }

  vec4 col = vec4( 0.0 );
  col += fetch( uv + d * 1.00 ) * vec4( 1.0, 0.0, 0.0, 1.0 );
  col += fetch( uv + d * 1.80 ) * vec4( 0.0, 1.0, 0.0, 1.0 );
  col += fetch( uv + d * 2.60 ) * vec4( 0.0, 0.0, 1.0, 1.0 );

  gl_FragColor = col;
}
