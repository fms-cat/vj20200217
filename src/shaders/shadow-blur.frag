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
  vec2 texel = 1.0 / resolution;

  vec2 bv = texel * ( isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) );
  vec4 sum = vec4( 0.0 );

  vec4 tex = texture2D( sampler0, vUv );

  sum += 0.29411764705882354 * tex;
  vec2 suv = vUv - bv * 1.3333333333333333;
  sum += 0.35294117647058826 * texture2D( sampler0, suv );
  suv = vUv + bv * 1.3333333333333333;
  sum += 0.35294117647058826 * texture2D( sampler0, suv );

  gl_FragColor = vec4( sum.xy, tex.x, 1.0 );
}
