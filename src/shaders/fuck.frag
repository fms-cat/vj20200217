#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#define MTL_UNLIT 1.0
#define MTL_PBR 2.0

#extension GL_EXT_draw_buffers : require

precision highp float;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float time;
uniform vec2 resolution;

uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;

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
  float phase = time + 0.1 * p.z;
  phase = floor( phase ) - exp( -7.0 * fract( phase ) );
  vec4 dice1 = texture2D( samplerRandomStatic, phase * vec2( 0.0001, 0.0004 ) );
  vec4 dice2 = texture2D( samplerRandomStatic, phase * vec2( 0.0003, 0.0002 ) );
  p.xy = rot2d( 0.2 * ( dice1.w - 0.5 ) * p.z ) * p.xy;
  p.z = mod( p.z - 5.0 * time, 5.0 ) - 2.5;
  p.x = mod( p.x, 12.0 ) - 6.0;
  p.x = abs( p.x );
  p.zx = rot2d( time ) * p.zx;
  // p.zx = rot2d( time ) * p.zx;
  p.y = mod( p.y, 3.0 ) - 1.5;
  p = ifs( p, dice1.xyz, 1.0 + 1.0 * dice2.xyz );
  return box( p, vec3( 0.05 + 0.15 * dice2.w ) );
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
  vec3 rayOri = vec3( 0.0, 0.0, 8.0 );
  vec3 rayDir = normalize( vec3( p, -1.0 ) );
  rayDir.xy = rot2d( 0.2 * sin( time ) ) * rayDir.xy;
  rayDir.yz = rot2d( 0.1 * sin( 0.7 * time ) ) * rayDir.yz;
  rayDir.zx = rot2d( 0.1 * sin( 0.8 * time ) ) * rayDir.zx;
  float rayLen = 0.01;
  vec3 rayPos = rayOri + rayDir * rayLen;
  float dist;

  for ( int i = 0; i < 50; i ++ ) {
    dist = distFunc( rayPos );
    rayLen += 0.7 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
  }

  vec3 color = vec3( 0.0 );
  if ( dist < 0.01 ) {
    vec3 nor = normalFunc( rayPos, 1E-4 );
    vec3 ligPos = vec3( 3.0, 4.0, 5.0 );
    vec3 ligDir = normalize( rayPos - ligPos );
    float dotVL = dot( -nor, ligDir );
    float dotVN = dot( -nor, rayDir );
    vec3 dif = vec3( 0.1 ) * dotVL;
    color = dif + vec3( 2.1, 0.2, 0.4 ) * pow( 1.0 - abs( dotVN ), 3.0 );
  }

  color *= 1.0 - 0.2 * length( p );
  color.x = -0.1 + 1.2 * color.x;
  color.y = 0.0 + 0.1 * vUv.y + 0.9 * color.y;
  color.z = 0.1 + 0.8 * color.z;

  // gl_FragColor = vec4( color, 1.0 );
  gl_FragData[ 0 ] = vec4( vUv, 0.5, 1.0 );
  gl_FragData[ 1 ] = vPosition;
  gl_FragData[ 2 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 1.0, 0.0, 0.0 ), MTL_PBR );
}
