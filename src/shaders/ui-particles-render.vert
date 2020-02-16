#define HUGE 9E16
#define PI 3.141592654
#define TAU 6.283185307
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

#define MODE_RECT 0
#define MODE_GRID 1
#define MODE_CIRCLE 2
#define MODE_CHAR 3
#define MODE_ICON 4
#define MODE_BUTTON 5
#define MODES 6

// -------------------------------------------------------------------------------------------------

attribute vec2 computeUV;
attribute vec2 p;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vDice;
varying float vMode;
varying float vLife;

uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform float ppp;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

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

  vNormal = normalize( ( normalMatrix * vec4( 0.0, 0.0, 1.0, 1.0 ) ).xyz );

  vUv = 0.5 + 0.5 * p;

  vLife = tex0.w;

  vMode = tex1.w;
  int mode = int( vMode );

  // == compute size and direction =================================================================
  vPosition = vec4( tex0.xyz, 1.0 );

  vec2 size;

  if ( mode == MODE_RECT ) {
    size = 1.0 * vDice.xy;

  } else if ( mode == MODE_GRID ) {
    size = vec2( 0.25 + 0.25 * vDice.x );

  } else if ( mode == MODE_CIRCLE ) {
    size = vec2( 1.0 * vDice.x );

  } else if ( mode == MODE_CHAR ) {
    size = vec2( 0.2 + 0.2 * vDice.x );

  } else if ( mode == MODE_BUTTON ) {
    size = vec2( 1.0, 0.4 ) * ( 0.2 + 0.2 * vDice.x );

  } else if ( mode == MODE_ICON ) {
    size = vec2( 0.2 + 0.2 * vDice.x );

  }

  vPosition.xy += p * size;

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  // gl_PointSize = resolution.y * size / outPos.z;
}
