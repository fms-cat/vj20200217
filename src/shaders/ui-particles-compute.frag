#define PARTICLE_LIFE_LENGTH 1.0

#define HUGE 9E16
#define PI 3.14159265
#define TAU 6.283185307
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

#define MODE_RECT 0
#define MODE_GRID 1
#define MODE_CIRCLE 2
#define MODE_CHAR 3
#define MODE_ICON 4
#define MODE_BUTTON 5
#define MODES 6

// ------

precision highp float;

uniform float time;
uniform float beat;

uniform float particlesSqrt;
uniform float ppp;

uniform float totalFrame;
uniform bool init;
uniform float deltaTime;
uniform vec2 resolution;

uniform sampler2D samplerCompute;
uniform sampler2D samplerRandom;

uniform float noiseScale;
uniform float noisePhase;
// uniform float velScale;
// uniform float genRate;

uniform float midiCC[ 128 ];

// ------

vec2 uvInvT( vec2 _uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * _uv;
}

// ------

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

float fractSin( float i ) {
  return fract( sin( i ) * 1846.42 );
}

vec4 sampleRandom( vec2 _uv ) {
  return texture2D( samplerRandom, _uv );
}

#pragma glslify: prng = require( ./-prng );
#pragma glslify: noise = require( ./-simplex4d );

vec3 randomSphere( inout vec4 seed ) {
  vec3 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec3(
      prng( seed ),
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec2 randomCircle( inout vec4 seed ) {
  vec2 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec2(
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec3 randomBox( inout vec4 seed ) {
  vec3 v;
  v = vec3(
    prng( seed ),
    prng( seed ),
    prng( seed )
  ) * 2.0 - 1.0;
  return v;
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float pixId = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  float dt = deltaTime;

  // == prepare some vars ==========================================================================
  vec4 seed = texture2D( samplerRandom, puv );
  prng( seed );

  vec4 tex0 = texture2D( samplerCompute, puv );
  vec4 tex1 = texture2D( samplerCompute, puv + dpix * vec2( 1.0, 0.0 ) );

  vec3 pos = tex0.xyz;
  float life = tex0.w;
  vec3 vel = tex1.xyz;
  int mode = int( tex1.w );

  float timing = mix(
    0.0,
    PARTICLE_LIFE_LENGTH,
    ( floor( puv.x * particlesSqrt ) / particlesSqrt + floor( puv.y * particlesSqrt ) ) / particlesSqrt
  );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == initialize particles =======================================================================
  if (
    time - deltaTime < timing && timing <= time
    && prng( seed ) < midiCC[ 17 ]
  ) {
    dt = time - timing;

    pos.xyz = vec3( 5.0, 5.0, 3.0 ) * randomBox( seed );

    vel.xyz = 1.0 * randomSphere( seed );

    life = 1.0;

    mode = int( prng( seed ) * midiCC[ 18 ] * float( MODES ) );
    // mode = prng( seed ) < 0.5 ? MODE_ICON : mode;
  } else {
    // do nothing
    // if you want to remove init frag from the particle, do at here
  }

  // == update particles ===========================================================================
  pos += vec3( 0.5, 0.0, 0.0 ) * dt;
  life -= dt / PARTICLE_LIFE_LENGTH;

  gl_FragColor = (
    pixId < 1.0 ? vec4( pos, life ) :
    vec4( vel, mode )
  );
}
