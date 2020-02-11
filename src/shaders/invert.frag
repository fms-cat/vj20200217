precision highp float;

varying vec2 uv;

uniform sampler2D sampler0;

void main() {
  vec3 tex = texture2D( sampler0, uv ).xyz;
  gl_FragColor = vec4( 1.0 - tex, 1.0 );
}
