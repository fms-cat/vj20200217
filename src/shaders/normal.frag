precision highp float;

varying vec3 vNormal;

void main() {
  gl_FragColor = vec4( 0.5 + 0.5 * vNormal, 1.0 );
}
