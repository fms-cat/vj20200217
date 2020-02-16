#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#define MTL_UNLIT 1
#define MTL_PBR 2

#extension GL_EXT_draw_buffers : enable

precision highp float;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float time;
uniform vec2 resolution;

uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;

vec4 greenkey( vec3 rgb ) {
  float green = rgb.g - rgb.r - rgb.b;
  vec4 result = vec4( rgb, saturate( 1.0 - green ) );
  result.y = saturate( result.y - saturate( green ) );
  return result;
}

void main() {
  vec2 screenUv = vUv;
  screenUv.y = 1.0 - screenUv.y;
  screenUv = mix( vec2( 0.2, 0.1 ), vec2( 0.9, 0.8 ), screenUv );

  vec4 color = texture2D( samplerCapture, screenUv );
  color = greenkey( color.xyz );
  if ( color.w < 0.8 ) { discard; }
  color.xyz = 0.8 * pow( color.xyz, vec3( 2.2 ) );

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( color.xyz, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 1.0, 0.0, 0.0 ), MTL_PBR );
}
