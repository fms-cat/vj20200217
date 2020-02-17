#define PI 3.14159265
#define TAU 6.28318531
#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#define MTL_UNLIT 1
#define MTL_PBR 2

#extension GL_EXT_draw_buffers : enable

precision highp float;

// == varings / uniforms ===========================================================================
varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying float vLife;
varying vec4 vRandom;

uniform float time;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// == main procedure ===============================================================================
void main() {
  if ( vColor.a < 0.0 ) { discard; }

  float emissive = 40.0;
  // emissive *= 0.5 + 0.5 * sin( TAU * vRandom.z + 20.0 * time );

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = 0.1 * vColor;
  gl_FragData[ 3 ] = vec4( vec3( 0.9, 0.9, emissive ), MTL_PBR );
}
