#define saturate(i) clamp(i,0.,1.)
#define PI 3.14159265
#define SAMPLES 30
#define MUL_THR 1E-4

// ------

precision highp float;

varying vec2 vUv;
uniform vec2 resolution;
uniform bool isVert;
uniform sampler2D sampler0;

float gaussian( float _x, float _v ) {
  return 1.0 / sqrt( 2.0 * PI * _v ) * exp( - _x * _x / 2.0 / _v );
}

void main() {
  vec2 halfTexel = 1.0 / resolution; // * 0.5;

  float lv = ceil( -log( 1.0 - min( vUv.x, vUv.y ) ) / log( 2.0 ) );
  float p = pow( 0.5, lv );
  vec2 clampMin = floor( vUv / p ) * p + halfTexel;
  vec2 clampMax = clampMin + p - 2.0 * halfTexel;

  vec2 bv = halfTexel * ( isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) );
  vec4 sum = vec4( 0.0 );

  sum += 0.2270270270 * texture2D( sampler0, vUv );
  vec2 suv = clamp( vUv - bv * 1.3846153846, clampMin, clampMax );
  sum += 0.3162162162 * texture2D( sampler0, suv );
  suv = clamp( vUv + bv * 1.3846153846, clampMin, clampMax );
  sum += 0.3162162162 * texture2D( sampler0, suv );
  suv = clamp( vUv - bv * 3.2307692308, clampMin, clampMax );
  sum += 0.0702702703 * texture2D( sampler0, suv );
  suv = clamp( vUv + bv * 3.2307692308, clampMin, clampMax );
  sum += 0.0702702703 * texture2D( sampler0, suv );

  gl_FragColor = vec4( sum.xyz, 1.0 );
}
