precision highp float;

#define MTL_UNLIT 1
#define MTL_PBR 2

#extension GL_EXT_draw_buffers : require

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 color = mix(
    vec3( 1.0, 0.0, 0.0 ),
    vec3( 0.0, 0.0, 1.0 ),
    vUv.y
  );

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( -vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( 0.5 - 0.5 * vNormal, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0 ), MTL_UNLIT );
}
