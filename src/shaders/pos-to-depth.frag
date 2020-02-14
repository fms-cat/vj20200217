precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

// == varings / uniforms ===========================================================================
varying vec2 vUv;
uniform sampler2D sampler0;
uniform vec2 perspNearFar;

// == common =======================================================================================
float calcDepth( float z ) {
  float near = perspNearFar.x;
  float far = perspNearFar.y;
  float d = 1.0 / ( far - near );
  float a = -( near + far ) * d;
  float b = -2.0 * near * far * d;
  return linearstep( near, far, -b / ( -z - a ) );
}

// == main procedure ===============================================================================
void main() {
  vec4 tex = texture2D( sampler0, vUv );
  float depth = calcDepth( tex.w );
  gl_FragColor = vec4( depth, depth * depth, depth, 1.0 );
}
