precision highp float;

#define MTL_UNLIT 1

#extension GL_EXT_draw_buffers : require

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform sampler2D sampler0;

void main() {
  vec4 color = texture2D( sampler0, vUv );
  if ( color.w < 0.5 ) { discard; }

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( color.xyz, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0, 0.0, 0.0 ), MTL_UNLIT );
}
