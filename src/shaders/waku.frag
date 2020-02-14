precision highp float;

#define MTL_UNLIT 1

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

#extension GL_EXT_draw_buffers : require

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float time;
uniform vec2 uvScale;

#pragma glslify: noise = require( ./-simplex4d );

float plasmaField( vec2 p, float t ) {
  // https://www.bidouille.org/prog/plasma
  float field = sin( 4.0 * p.x - t );
  field += 1.4 * sin( 4.0 * ( p.x * sin( t * 0.8 ) + p.y * cos( t * 0.7 ) + t ) );
  field += 2.0 * sin( 2.0 * ( p.x * sin( t * 0.5 ) + p.y * cos( t * 0.3 ) + t ) );
  return field / 8.8 + 0.5;
}

void main() {
  vec2 uv = uvScale * ( vUv - 0.5 );
  vec2 uvLo = lofi( uv, 0.0125 );
  vec2 uvCell = fract( uv / 0.0125 );

  float noiseField = 0.5 + 0.5 * sin( 7.0 * noise( vec4( 4.0 * uvLo, 0.48 * time, 0.4 * time ) ) );

  float len = max( abs( uvCell.x - 0.5 ), abs( uvCell.y - 0.5 ) );
  float shape = step( linearstep( 0.05, 0.5, len ), noiseField );

  if ( shape < 0.5 ) { discard; }

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0, 0.0, 0.0 ), MTL_UNLIT );
}
