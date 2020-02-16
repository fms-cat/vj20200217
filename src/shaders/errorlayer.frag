#define PI 3.141592654
#define TAU 6.283185307
#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

#define MTL_UNLIT 1
#define MTL_PBR 2

#extension GL_EXT_draw_buffers : enable

precision highp float;

// == varings / uniforms ===========================================================================
varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float time;
uniform float errorTime;
uniform float resolvedTime;

uniform sampler2D sampler0;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

vec3 catColor( float t ) {
  return 0.5 + 0.5 * cos( t + vec3( 0.0, 4.0, 2.0 ) * PI / 3.0 );
}

float fractSin( float v ) {
  return fract( 17.351 * sin( 27.119 * v ) );
}

float rgb2gray( vec3 c ) {
  return 0.299 * c.x + 0.587 * c.y + 0.114 * c.z;
}

// == glitch =======================================================================================
vec2 displace( vec2 uv, float threshold ) {
  float seed = fractSin( lofi( uv.y, 0.125 ) + fractSin( lofi( uv.x, 0.25 ) ) );
  if ( seed < threshold ) { return vec2( 0.0 ); }

  vec2 d = vec2( 0.0 );
  seed = fractSin( seed );
  d.x = seed - 0.5;

  return d;
}

// == fetch ========================================================================================
vec4 fetch( vec2 uv ) {
  vec2 uvt = saturate( uv );
  float anix = abs( uvt.x - 0.5 ) + 0.5 * exp( -10.0 * errorTime );
  if ( 0.5 < anix ) { return vec4( 0.0 ); }

  float b = 0.0;

  // -- slasher ------------------------------------------------------------------------------------
  anix = abs( uvt.x - 0.5 ) + 0.5 * exp( -10.0 * ( errorTime - 0.2 ) );

  b += step( 0.0, sin( 100.0 * ( 2.0 * uvt.x + uvt.y ) + 10.0 * time ) )
    * step( anix, 0.48 )
    * step( 0.08, abs( uvt.x - 0.5 ) )
    * step( abs( uvt.y - 0.1 ), 0.06 );

  // -- hr -----------------------------------------------------------------------------------------
  anix = abs( uvt.x - 0.5 ) + 0.5 * exp( -10.0 * ( errorTime - 0.3 ) );

  b += step( abs( uvt.y - 0.20 ), 0.002 )
    * step( anix, 0.48 );

  // -- canvas -------------------------------------------------------------------------------------
  b += texture2D( sampler0, uvt ).r * (
    errorTime < 0.4 ? 0.0 :
    errorTime < 0.6 ? step( 0.0, sin( 160.0 * errorTime ) ) :
    1.0
  );

  // -- check ---------------------------------------------------------------------------------------
  float animCheck = ( 1.0 - exp( -10.0 * resolvedTime ) );
  vec2 uvtc = rotate2D( -PI / 4.0 ) * ( ( uvt - 0.5 ) * vec2( 2.0, 1.0 ) );
  float thicc = 0.05 * animCheck;
  b += (
    step( abs( uvtc.x - 0.15 ), thicc ) * step( abs( uvtc.y + 0.05 ), 0.25 + thicc )
    + step( abs( uvtc.x + 0.0 ), 0.15 + thicc ) * step( abs( uvtc.y - 0.2 ), thicc )
  );

  // -- wipe ---------------------------------------------------------------------------------------
  float wipet = abs( uv.x - 0.5 );
  b += step( wipet, smoothstep( 0.0, 0.5, resolvedTime - 0.5 ) );
  if ( 0.5 < step( wipet, smoothstep( 0.0, 0.5, resolvedTime - 0.6 ) ) ) {
    return vec4( 0.0 );
  }

  return vec4( mix(
    vec3( 0.5, 0.01, 0.01 ),
    vec3( 1.0 ),
    saturate( b )
  ), 1.0 );
}

// == main procedure ===============================================================================
void main() {
  vec2 uv = vUv.xy;
  uv.y = 1.0 - uv.y;

  vec2 d = vec2( 0.0 );
  for ( int i = 0; i < 3; i ++ ) {
    float p = pow( 2.4, float( i ) );
    float thr = 1.05 - 0.1 * fractSin( 0.1 * lofi( errorTime, 0.2 ) );
    thr = thr * pow( thr, float( i ) );
    d += displace( uv * p + 50.0 * fractSin( 0.1 * time ), thr ) * 0.4 / p;
  }

  vec4 col = vec4( 0.0 );
  col += fetch( uv + d * 1.00 ) * vec4( 1.0, 0.0, 0.0, 1.0 );
  col += fetch( uv + d * 1.80 ) * vec4( 0.0, 1.0, 0.0, 1.0 );
  col += fetch( uv + d * 2.60 ) * vec4( 0.0, 0.0, 1.0, 1.0 );

  if ( col.w == 0.0 ) { discard; }

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( col.xyz, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.8, 0.2, 0.0 ), MTL_PBR );
}
