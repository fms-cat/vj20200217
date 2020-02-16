#define PI 3.14159265
#define TAU 6.28318531
#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define xor(a,b) (mix((a),1.0-(a),(b)))

#define PIXIV_BLUE vec3( 0.0, 0.311, 0.957 )
#define FADE_10 vec3( 0.914 )
#define FADE_60 vec3( 0.105 )

#define MTL_UNLIT 1
#define MTL_PBR 2

#define MODE_RECT 0
#define MODE_GRID 1
#define MODE_CIRCLE 2
#define MODE_CHAR 3
#define MODE_ICON 4
#define MODE_BUTTON 5
#define MODES 6

#extension GL_EXT_draw_buffers : enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

// == varings / uniforms ===========================================================================
varying vec4 vPosition;
varying vec3 vNormal;
varying float vLife;
varying vec2 vUv;
varying vec4 vDice;
varying float vMode;

uniform float time;
uniform vec2 resolution;
uniform sampler2D samplerDoublequoteRandom;
uniform sampler2D samplerChar;
uniform sampler2D samplerWord;
uniform sampler2D samplerIcon;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

vec2 uvInvT( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  int mode = int( vMode + 0.5 );

  vec3 color = vec3( 0.0 );

  if ( vLife < 0.0 ) { discard; }
  if ( vLife < 0.1 && 0.5 < fract( 30.0 * vLife ) ) { discard; }

  if ( mode == MODE_RECT ) {
    vec2 size = vec2( 0.5 );
    size.y *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;
    vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );
    vec2 folded = ( size - abs( uv - 0.5 ) ) / deltaUv;
    bool isVert = false;

    if ( folded.x < folded.y ) {
      uv.xy = vec2( uv.y, uv.x );
      folded.xy = folded.yx;
      deltaUv.xy = deltaUv.yx;
      isVert = true;
    }

    float spinUvx = uv.y < 0.5 ? uv.x : ( 1.0 - uv.x );
    spinUvx = isVert ? ( 1.0 - spinUvx ) : spinUvx;

    float border = step( 0.0, folded.y ) * step( folded.y, 2.0 );
    border *= step( 0.0, sin( 12.0 * time + 0.5 * spinUvx / deltaUv.x ) ); // dashed

    if ( border < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_GRID ) {
    float size = 0.2;
    size *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;

    vec2 folded = mod( 4.0 * uv, 1.0 );

    float shape = step( length( folded - 0.5 ), size );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_CIRCLE ) {
    float size = 0.5;
    size *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;
    vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );

    float r = length( uv - 0.5 );
    float shape = step( r, size );
    shape *= step( size, r + length( deltaUv ) );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_CHAR ) {
    float anim = exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;

    vec2 charUv = uvInvT( vUv );
    charUv *= 0.0625;
    charUv.xy += lofi(
      mix(
        vec2( 0.0, 0.125 ),
        vec2( 1.0, 0.5 ),
        fract( 777.77 * vDice.xy )
      ),
      0.0625
    );

    float tex = texture2D( samplerChar, charUv ).x;
    float shape = step( tex, 0.0 );

    shape = xor( step( uv.y + 0.01, anim ), shape );

    shape *= step( abs( uv.x - 0.5 ), 0.4 );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_BUTTON ) {
    float size = 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    color = PIXIV_BLUE;

    vec2 uv = vUv;

    vec2 folded = uv;
    folded = 0.5 - abs( folded - 0.5 );
    folded.x /= 0.4;
    folded = 0.5 - folded;
    folded.x = max( folded.x, 0.0 );

    float shape = step( length( folded ), 0.5 * size );

    if ( shape < 0.5 ) { discard; }

    vec2 wordUv = uvInvT( vUv );
    wordUv = clamp( ( wordUv - 0.5 ) / size / vec2( 0.9, 0.59 ) + 0.5, 0.01, 0.99 ); // I'm dumb
    wordUv *= vec2( 0.5, 0.125 );
    wordUv.xy += lofi(
      fract( 777.77 * vDice.xy ),
      vec2( 0.5, 0.125 )
    );

    float tex = texture2D( samplerWord, wordUv ).x;

    color = mix(
      mix( vec3( 1.0 ), PIXIV_BLUE, linearstep( -0.5, 0.5, tex ) ),
      mix( FADE_60, FADE_10, linearstep( -0.5, 0.5, tex ) ),
      step( 0.5, wordUv.x )
    );

  } else if ( mode == MODE_ICON ) {
    float size = 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;
    uv -= 0.5;
    uv = rotate2D( 3.0 * exp( -10.0 * ( 1.0 - vLife ) ) ) * uv;
    uv = clamp( uv / size, -0.5, 0.5 );
    uv += 0.5;

    vec2 iconUv = uvInvT( uv );
    iconUv *= vec2( 0.125, 0.25 );
    iconUv.xy += lofi(
      fract( 777.77 * vDice.xy ),
      vec2( 0.125, 0.25 )
    );

    float tex = texture2D( samplerIcon, iconUv ).x;
    float shape = step( tex, 0.0 );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  }

  gl_FragData[ 0 ] = vPosition;
  gl_FragData[ 1 ] = vec4( vNormal, 1.0 );
  gl_FragData[ 2 ] = vec4( color, 1.0 );
  gl_FragData[ 3 ] = vec4( vec3( 0.0 ), MTL_UNLIT );
}
