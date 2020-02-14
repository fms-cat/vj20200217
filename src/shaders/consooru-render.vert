#define HUGE 9E16
#define PI 3.141592654
#define TAU 6.283185307
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

#define MODE_NONE 0
#define MODE_E 1
#define MODE_W 2
#define MODE_I 3
#define MODE_V 4

// -------------------------------------------------------------------------------------------------

attribute vec2 computeUV;
attribute vec2 p;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vUv;
varying vec4 vDice;
varying vec2 vCharPos;
varying float vCode;
varying float vMode;
varying float vLifetime;

uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform float ppp;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform bool isShadow;

uniform float trailShaker;
uniform float colorVar;
uniform float colorOffset;

uniform sampler2D samplerCompute;
uniform sampler2D samplerRandomStatic;

// -------------------------------------------------------------------------------------------------

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 4.0 ),
    cos( _p + PI / 3.0 * 2.0 )
  );
}

vec4 random( vec2 _uv ) {
  return texture2D( samplerRandomStatic, _uv );
}

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// -------------------------------------------------------------------------------------------------

void main() {
  vec2 puv = vec2( computeUV );
  vec2 dppix = vec2( 1.0 ) / resolutionCompute;

  // == fetch texture ==============================================================================
  vec4 tex0 = texture2D( samplerCompute, puv );
  vec4 tex1 = texture2D( samplerCompute, puv + dppix * vec2( 1.0, 0.0 ) );

  // == assign varying variables ===================================================================
  vDice = random( tex1.xy * 182.92 );

  vNormal = normalize( ( modelMatrix * vec4( 0.0, 0.0, 1.0, 0.0 ) ).xyz );

  vColor.xyz = vec3( 1.0 );

  vUv = 0.5 + 0.5 * p;

  vLifetime = tex0.w;

  vCode = tex1.x;

  vMode = tex1.y;
  int mode = int( vMode );

  // == mode =======================================================================================
  if ( mode == MODE_E ) {
    vColor.xyz = vec3( 1.4, 0.1, 0.4 );

  } else if ( mode == MODE_W ) {
    vColor.xyz = vec3( 1.5, 0.7, 0.1 );

  } else if ( mode == MODE_I ) {
    vColor.xyz = vec3( 0.1, 0.4, 1.1 );

  } else if ( mode == MODE_V ) {
    vColor.xyz = vec3( 0.6, 0.3, 1.0 );

  }

  // == compute size and direction =================================================================
  vPosition = vec4( tex0.xyz, 1.0 );
  vCharPos = vPosition.xy;

  vec2 size;

  size = vec2( 0.4 );

  vPosition.xy += p * size;

  // == transformation tweak =======================================================================
  vPosition.xyz *= 0.15;
  vPosition.xyz += vec3( -2.4, -1.3, 0.5 );

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  // gl_PointSize = resolution.y * size / outPos.z;
}
