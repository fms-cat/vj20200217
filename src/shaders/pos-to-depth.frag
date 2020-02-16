precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

// == varings / uniforms ===========================================================================
varying vec2 vUv;
uniform sampler2D sampler0;
uniform vec3 cameraPos;
uniform vec2 cameraNearFar;

// == main procedure ===============================================================================
void main() {
  vec4 tex = texture2D( sampler0, vUv );
  float depth = linearstep(
    cameraNearFar.x,
    cameraNearFar.y,
    length( cameraPos - tex.xyz )
  );
  gl_FragColor = vec4( depth, depth * depth, depth, 1.0 );
}
