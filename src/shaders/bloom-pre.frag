precision highp float;

varying vec2 vUv;
uniform sampler2D sampler0;

void main() {
  gl_FragColor = vec4(
    max( vec3( 0.0 ), ( texture2D( sampler0, vUv ).xyz - 1.0 ) * 1.0 ),
    1.0
  );
}
