#define PARTICLE_LIFE_LENGTH 5.0
#define SPHERE_RADIUS 1.0

#define HUGE 9E16
#define PI 3.14159265
#define TAU 6.283185307
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

// ------

precision highp float;

uniform float time;
uniform float beat;

uniform float trails;
uniform float trailLength;
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

float uneune( float i, float p ) {
  return sin( TAU * (
    fractSin( i ) + floor( 1.0 + 4.0 * fractSin( i + 54.12 ) ) * p
  ) );
}

vec3 uneune3( float i, float p ) {
  return vec3( uneune( i, p ), uneune( i + 11.87, p ), uneune( i + 21.92, p ) );
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float pixId = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  float dt = deltaTime;

  // == if it is not head of particles =============================================================
  if ( ppp < gl_FragCoord.x ) {
    puv.x -= ppp / resolution.x;
    vec4 tex0 = texture2D( samplerCompute, puv );
    vec4 tex1 = texture2D( samplerCompute, puv + dpix * vec2( 1.0, 0.0 ) );

    tex0.w = saturate( tex0.w - 1.0 / trailLength ); // decrease the life

    gl_FragColor = (
      pixId < 1.0 ? tex0 :
      tex1
    );
    return;
  }

  // == prepare some vars for fuck around head particle ============================================
  vec4 seed = texture2D( samplerRandom, puv );
  prng( seed );

  vec4 tex0 = texture2D( samplerCompute, puv );
  vec4 tex1 = texture2D( samplerCompute, puv + dpix * vec2( 1.0, 0.0 ) );

  vec3 pos = tex0.xyz;
  float life = tex0.w;
  vec3 vel = tex1.xyz;
  float jumpFlag = tex1.w;

  float timing = mix( 0.0, PARTICLE_LIFE_LENGTH, floor( puv.y * trails ) / trails );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == initialize particles =======================================================================
  if (
    time - deltaTime < timing && timing <= time
    // prng( seed ) < genRate
  ) {
    dt = time - timing;

    pos = SPHERE_RADIUS * randomSphere( seed );

    vel = 1.0 * randomSphere( seed );

    life = 1.0;

    jumpFlag = 1.0;
  } else {
    jumpFlag = 0.0; // remove jumping flag
  }

  // == update particles ===========================================================================
  vec3 posFromSphereCenter = pos.xyz;

  // spin around center
  vel.zx += dt * 20.0 * vec2( -1.0, 1.0 ) * normalize( posFromSphereCenter.xz );

  // sphere
  vel += dt * 20.0 * ( SPHERE_RADIUS - length( posFromSphereCenter ) ) * normalize( posFromSphereCenter );

  // noise field
  vel += 40.0 * vec3(
    noise( vec4( 0.7 * pos.xyz, 1.485 + sin( time * 0.1 ) + noisePhase ) ),
    noise( vec4( 0.7 * pos.xyz, 3.485 + sin( time * 0.1 ) + noisePhase ) ),
    noise( vec4( 0.7 * pos.xyz, 5.485 + sin( time * 0.1 ) + noisePhase ) )
  ) * dt;

  // resistance
  vel *= exp( -10.0 * dt );

  vec3 v = vel;
  float vmax = max( abs( v.x ), max( abs( v.y ), abs( v.z ) ) );
  // v *= (
  //   abs( v.x ) == vmax ? vec3( 1.0, 0.0, 0.0 ) :
  //   abs( v.y ) == vmax ? vec3( 0.0, 1.0, 0.0 ) :
  //   vec3( 0.0, 0.0, 1.0 )
  // );

  // pos.xyz += velScale * v * dt;
  pos += v * dt;
  life -= dt / PARTICLE_LIFE_LENGTH;

  gl_FragColor = (
    pixId < 1.0 ? vec4( pos, life ) :
    vec4( vel, jumpFlag )
  );
}
