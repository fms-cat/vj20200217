#define PI 3.14159265
#define TAU 6.28318531
#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define xor(a,b) (mix((a),1.0-(a),(b)))

#define PIXIV_BLUE vec3( 0.0, 0.311, 0.957 )
#define FADE_10 vec3( 0.914 )
#define FADE_60 vec3( 0.105 )

#define MTL_UNLIT 1
#define MTL_PBR 2

#extension GL_EXT_draw_buffers : enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

// == varings / uniforms ===========================================================================
varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying float vLifetime;
varying vec2 vUv;
varying vec2 vCharPos;
varying vec4 vDice;
varying float vCode;
varying float vMode;

uniform float time;
uniform vec2 resolution;
uniform sampler2D samplerChar;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

vec2 uvInvT( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  int mode = int( vMode + 0.5 );

  vec3 color = vec3( 0.0 );

  float anim = exp( -10.0 * vLifetime );

  vec2 uv = vUv;

  float code = vCode + 0.5;

  vec2 charUv = uvInvT( vUv );
  charUv *= 0.0625;
  charUv.xy += lofi(
    vec2( fract( code * 0.0625 ), code * 0.0625 * 0.0625 ),
    0.0625
  );

  float tex = texture2D( samplerChar, charUv ).x;
  float shape = step( tex, 0.0 );

  if ( shape < 0.5 ) { discard; }

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( vColor.xyz, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0 ), MTL_UNLIT );
}
