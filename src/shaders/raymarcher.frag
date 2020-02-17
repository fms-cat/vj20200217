#define MARCH_ITER 50

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#define MTL_UNLIT 1
#define MTL_PBR 2
#define MTL_GRADIENT 3
#define MTL_IRIDESCENT 4

#extension GL_EXT_frag_depth : enable
#extension GL_EXT_draw_buffers : enable

precision highp float;

varying vec2 vUv;

uniform float time;
uniform vec2 resolution;

uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;
uniform vec2 cameraNearFar;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePV;

uniform float midiCC[ 128 ];

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

#pragma glslify: distFunc = require( ./-distFunc );

float distFunc( vec3 p ) {
  return distFunc( p, time, midiCC );
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    distFunc( p + d.yxx ) - distFunc( p - d.yxx ),
    distFunc( p + d.xyx ) - distFunc( p - d.xyx ),
    distFunc( p + d.xxy ) - distFunc( p - d.xxy )
  ) );
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;
  vec3 rayOri = divideByW( inversePV * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePV * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = cameraNearFar.x;
  vec3 rayPos = rayOri + rayDir * rayLen;
  float dist;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    dist = distFunc( rayPos, time, midiCC );
    rayLen += 0.7 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 normal = normalFunc( rayPos, 1E-4 );
  vec4 color = vec4( 0.1, 0.2, 0.4, 1.0 );

  vec4 projPos = projectionMatrix * viewMatrix * vec4( rayPos, 1.0 ); // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepthEXT = 0.5 + 0.5 * depth;

  // gl_FragData[ 2 ] = vec4( color, 1.0 );
  gl_FragData[ 0 ] = vec4( rayPos, depth );
  gl_FragData[ 1 ] = vec4( normal, 1.0 );
  gl_FragData[ 2 ] = color;
  gl_FragData[ 3 ] = vec4( vec3( 10.0, 0.6, 0.9 ), MTL_IRIDESCENT );
}
