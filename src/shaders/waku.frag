precision highp float;

#define MTL_UNLIT 1

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

#extension GL_EXT_draw_buffers : enable

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float time;
uniform vec2 uvScale;

#pragma glslify: noise = require( ./-simplex4d );

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
