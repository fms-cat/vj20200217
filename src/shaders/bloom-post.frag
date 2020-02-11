precision highp float;

varying vec2 vUv;
uniform sampler2D samplerDry;
uniform sampler2D samplerWet;

void main() {
  gl_FragColor = texture2D( samplerDry, vUv );
  for ( int i = 0; i < 5; i ++ ) {
    float fuck = pow( 0.5, float( i ) );
    vec2 suv = mix( vec2( 1.0 - fuck ), vec2( 1.0 - 0.5 * fuck ), vUv );
    gl_FragColor += texture2D( samplerWet, suv );
  }
  gl_FragColor.xyz = pow( max( vec3( 0.0 ), gl_FragColor.xyz ), vec3( 0.4545 ) );
}
