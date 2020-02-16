precision highp float;

#define MTL_UNLIT 1

#extension GL_EXT_draw_buffers : enable

varying vec4 vPosition;
varying vec3 vNormal;

void main() {
  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( 0.5 + 0.5 * vNormal, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0, 0.0, 0.0 ), MTL_UNLIT );
}
