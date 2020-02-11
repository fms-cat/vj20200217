attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

#ifdef USE_VERTEX_COLOR
  attribute vec4 color;
  varying vec4 vColor;
#endif

uniform vec2 resolution;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

// ------

void main() {
  vNormal = normalize( ( modelMatrix * vec4( normal, 0.0 ) ).xyz );

  vPosition = modelMatrix * vec4( position, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

#ifdef USE_VERTEX_COLOR
  vColor = color;
#endif

  vUv = uv;
}
