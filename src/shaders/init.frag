#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

precision highp float;

uniform float time;
uniform vec2 resolution;

uniform sampler2D samplerScreen;
uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerFeedback;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  vec2 uvScreen = uv;
  uvScreen.y = 1.0 - uvScreen.y;
  uvScreen = ( uvScreen - 0.5 ) * 0.7 + 0.5;

  vec3 texScreen = texture2D( samplerScreen, uvScreen ).xyz;
  float screenAlpha = linearstep( -0.1, 0.0, texScreen.x + texScreen.z - texScreen.y );

  vec3 color = vec3( uv, 0.5 + 0.5 * sin( time ) );
  color = mix(
    color,
    texScreen.xyz,
    screenAlpha
  );

  gl_FragColor = vec4( color, 1.0 );
}
