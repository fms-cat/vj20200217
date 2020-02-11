precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

// == varings / uniforms ===========================================================================
varying vec4 vPosition;

#ifdef USE_VERTEX_COLOR
  varying vec4 vColor;
#endif // USE_VERTEX_COLOR

#ifdef USE_UV
  varying vec2 vUv;
#endif // USE_UV

#ifdef SAMPLER_ALBEDO
  uniform sampler2D SAMPLER_ALBEDO;
#endif // SAMPLER_ALBEDO

#ifdef USE_CLIP
  uniform float clip;
#endif // USE_CLIP

uniform mat4 projectionMatrix;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

float calcDepth( float z ) {
  float a = projectionMatrix[ 2 ].z;
  float b = projectionMatrix[ 3 ].z;
  float near = 0.01;
  float far = 40.0;
  return linearstep( near, far, -b / ( -z - a ) );
}

// == main procedure ===============================================================================
void main() {
  float alpha = 1.0;

#ifdef USE_VERTEX_COLOR
  alpha = vColor.w;
#endif // USE_VERTEX_COLOR

#ifdef SAMPLER_ALBEDO
  alpha *= texture2D( SAMPLER_ALBEDO, vUv ).w;
#endif // SAMPLER_ALBEDO

#ifdef USE_CLIP
  if ( alpha < clip ) { discard; }
#endif // USE_CLIP

  float depth = calcDepth( vPosition.w );
  gl_FragColor = vec4( depth, depth * depth, 0.0, 1.0 );
}
