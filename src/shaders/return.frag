precision highp float;

varying vec2 vUv;
uniform sampler2D sampler0;

void main() {
  gl_FragColor = texture2D( sampler0, vUv );
}
