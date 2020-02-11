#define HUGE 9E16
#define PI 3.141592654
#define TAU 6.283185307
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------

attribute vec2 computeUV;
attribute vec2 p;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vUv;
varying float vLife;
varying float vIsOkayToDraw;

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
  vec4 pos = texture2D( samplerCompute, puv );
  vec4 vel = texture2D( samplerCompute, puv + dppix * vec2( 1.0, 0.0 ) );

  // == assign varying variables ===================================================================
  vLife = pos.w;

  vec4 dice = random( puv.yy * 182.92 );
  vColor.xyz = (
    dice.y < 0.8
    ? pow( catColor( TAU * ( ( dice.x * 2.0 - 1.0 ) * colorVar + 0.4 + colorOffset ) ), vec3( 2.0 ) )
    : vec3( 0.4 )
  );

  // == compute size and direction =================================================================
  float size = 0.1 + 0.1 * pow( dice.w, 2.0 );

  pos.xy += p * size;

  vUv = 0.5 + 0.5 * p;

  vNormal = normalize( ( modelMatrix * vec4( 0.0, 0.0, 1.0, 0.0 ) ).xyz );

  vPosition = modelMatrix * vec4( pos.xyz, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  // gl_PointSize = resolution.y * size / outPos.z;
}
