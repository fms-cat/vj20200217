#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#define MTL_UNLIT 1
#define MTL_PBR 2

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

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

mat2 rot2d( float t ) {
  float c = cos( t );
  float s = sin( t );
  return mat2( c, -s, s, c );
}

vec3 ifs( vec3 p, vec3 r, vec3 t ) {
  vec3 s = t;

  for ( int i = 0; i < 5; i ++ ) {
    p = abs( p ) - abs( s ) * pow( 0.5, float( i ) );

    s.yz = rot2d( r.x ) * s.yz;
    s.zx = rot2d( r.y ) * s.zx;
    s.xy = rot2d( r.z ) * s.xy;

    p.xy = p.x < p.y ? p.yx : p.xy;
    p.yz = p.y < p.z ? p.zy : p.yz;
    p.xz = p.x < p.z ? p.zx : p.xz;
  }

  return p;
}

float box( vec3 p, vec3 d ) {
  vec3 absp = abs( p );
  return max( ( absp.x - d.x ), max( ( absp.y - d.y ), ( absp.z - d.z ) ) );
}

float distFunc( vec3 p ) {
  // float phase = time + 0.1 * p.z;
  // phase = floor( phase ) - exp( -7.0 * fract( phase ) );
  // vec4 dice1 = texture2D( samplerRandomStatic, phase * vec2( 0.0001, 0.0004 ) );
  // vec4 dice2 = texture2D( samplerRandomStatic, phase * vec2( 0.0003, 0.0002 ) );
  // p.xy = rot2d( 0.2 * ( dice1.w - 0.5 ) * p.z ) * p.xy;
  // p.z = mod( p.z - 5.0 * time, 5.0 ) - 2.5;
  // p.x = mod( p.x, 12.0 ) - 6.0;
  // p.x = abs( p.x );
  // p.zx = rot2d( time ) * p.zx;
  // p.y = mod( p.y, 3.0 ) - 1.5;
  // p = ifs( p, dice1.xyz, 1.0 + 1.0 * dice2.xyz );
  // return box( p, vec3( 0.05 + 0.15 * dice2.w ) );
  return length( p ) - 0.5;
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

  for ( int i = 0; i < 50; i ++ ) {
    dist = distFunc( rayPos );
    rayLen += 0.7 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 normal = normalFunc( rayPos, 1E-4 );
  vec4 color = vec4( 0.5, 0.5, 0.5, 1.0 );

  vec4 projPos = projectionMatrix * viewMatrix * vec4( rayPos, 1.0 ); // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepthEXT = 0.5 + 0.5 * depth;

  // gl_FragData[ 2 ] = vec4( color, 1.0 );
  gl_FragData[ 0 ] = vec4( rayPos, depth );
  gl_FragData[ 1 ] = vec4( normal, 1.0 );
  gl_FragData[ 2 ] = color;
  gl_FragData[ 3 ] = vec4( vec3( 1.0, 0.9, 0.0 ), MTL_PBR );
}
