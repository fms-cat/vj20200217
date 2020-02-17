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
#define MODE_BUTTON 4
#define MODE_ICON 5
#define MODES 6

// -------------------------------------------------------------------------------------------------

attribute vec2 computeUV;
attribute vec3 position;
attribute vec3 normal;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vUv;
varying vec4 vDice;
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
  vDice = random( puv.xy * 182.92 );

  vColor.xyz = 0.8 * mix( catColor( 2.0 + 40.0 * vDice.x ), vec3( 0.9 ), 0.0 );
  vColor.xyz = vec3( 0.2 );

  vLife = tex0.w;

  // == compute size ===============================================================================
  vPosition = vec4( tex0.xyz, 1.0 );

  float size = vDice.x * 0.08;
  size *= sin( PI * saturate( vLife ) );

  vec3 shape = position * size;
  shape.yz = rotate2D( 7.0 * vPosition.x ) * shape.yz;
  shape.zx = rotate2D( 7.0 * vPosition.y ) * shape.zx;

  vPosition.xyz += shape;

  // == compute normals ============================================================================
  vNormal = ( normalMatrix * vec4( normal, 1.0 ) ).xyz;
  vNormal.yz = rotate2D( 7.0 * vPosition.x ) * vNormal.yz;
  vNormal.zx = rotate2D( 7.0 * vPosition.y ) * vNormal.zx;

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  // gl_PointSize = resolution.y * size / outPos.z;
}
