precision highp float;

varying vec2 vUv;
uniform sampler2D sampler0;

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;
  gl_FragColor = texture2D( sampler0, uv );
}
