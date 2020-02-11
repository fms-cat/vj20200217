#define MTL_NONE 0.0
#define MTL_UNLIT 1.0
#define MTL_PBR 2.0

#define PI 3.14159265359
#define TAU 6.28318530718
#define EPSILON 1E-3
#define BLACK vec3( 0.0 )
#define DIELECTRIC_SPECULAR vec3( 0.04 )

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

precision highp float;

varying vec2 vUv;

uniform vec3 cameraPos;
uniform vec3 lightPos;
uniform mat4 lightPV;
uniform vec2 lightNearFar;
uniform mat4 viewMatrix;

uniform sampler2D sampler0; // color.rgba
uniform sampler2D sampler1; // position.xyz, depth
uniform sampler2D sampler2; // normal.xyz (yes, this is not good)
uniform sampler2D sampler3; // materialParams.xyz, materialId
uniform sampler2D samplerShadow;
uniform sampler2D samplerBRDFLUT;
uniform sampler2D samplerEnv;

struct Isect {
  vec3 albedo;
  vec3 position;
  float depth;
  vec3 normal;
  float materialId;
  vec3 materialParams;
};

struct AngularInfo {
  vec3 V;
  vec3 L;
  vec3 H;
  float dotNV;
  float dotNL;
  float dotNH;
  float dotVH;
};

AngularInfo genAngularInfo( Isect isect ) {
  AngularInfo aI;
  aI.V = normalize( cameraPos - isect.position );
  aI.L = normalize( lightPos - isect.position );
  aI.H = normalize( aI.V + aI.L );
  aI.dotNV = clamp( dot( isect.normal, aI.V ), EPSILON, 1.0 );
  aI.dotNL = clamp( dot( isect.normal, aI.L ), EPSILON, 1.0 );
  aI.dotNH = clamp( dot( isect.normal, aI.H ), EPSILON, 1.0 );
  aI.dotVH = clamp( dot( aI.V, aI.H ), EPSILON, 1.0 );
  return aI;
}

float calcDepth( float z ) {
  float d = ( lightNearFar.y - lightNearFar.x );
  float a = -( lightNearFar.y + lightNearFar.x ) / d;
  float b = -2.0 * lightNearFar.y * lightNearFar.x / d;
  return -( a - b / z );
}

float getShadow( Isect isect, AngularInfo aI ) {
  float depth = linearstep( lightNearFar.x, lightNearFar.y, length( isect.position - lightPos ) );
  float bias = 0.01 + 0.01 * ( 1.0 - aI.dotNL );
  depth -= bias;

  vec4 proj = lightPV * vec4( isect.position, 1.0 );
  vec2 uv = proj.xy / proj.w * 0.5 + 0.5;

  vec4 tex = texture2D( samplerShadow, uv );

  float edgeClip = smoothstep( 0.4, 0.5, max( abs( uv.x - 0.5 ), abs( uv.y - 0.5 ) ) );

  float variance = saturate( tex.y - tex.x * tex.x );
  float md = depth - tex.x;
  float p = variance / ( variance + md * md );

  return depth <= tex.x ? 1.0 : p;
}

void main() {
  vec4 tex0 = texture2D( sampler0, vUv );
  vec4 tex1 = texture2D( sampler1, vUv );
  vec4 tex2 = texture2D( sampler2, vUv );
  vec4 tex3 = texture2D( sampler3, vUv );

  Isect isect;
  isect.albedo = tex0.rgb;
  isect.position = tex1.xyz;
  isect.depth = tex1.w;
  isect.normal = tex2.xyz;
  isect.materialId = tex3.w - 0.5;

  if ( isect.materialId < MTL_NONE ) {
    gl_FragColor = vec4( 0.0 );
    return;

  } else if ( isect.materialId < MTL_UNLIT ) {
    gl_FragColor = vec4( tex0.rgb, 1.0 );
    return;

  } else if ( isect.materialId < MTL_PBR ) {
    // ref: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/shaders/metallic-roughness.frag

    float roughness = tex3.x;
    float metallic = tex3.y;
    float emissive = tex3.z;

    AngularInfo aI = genAngularInfo( isect );

    float shadow = getShadow( isect, aI );

    vec3 F0 = mix( DIELECTRIC_SPECULAR, isect.albedo, metallic );
    vec3 F = F0 + ( 1.0 - F0 ) * pow( 1.0 - aI.dotVH, 5.0 );

    float roughnessSq = roughness * roughness;
    float GGXV = aI.dotNL * sqrt( aI.dotNV * aI.dotNV * ( 1.0 - roughnessSq ) + roughnessSq );
    float GGXL = aI.dotNV * sqrt( aI.dotNL * aI.dotNL * ( 1.0 - roughnessSq ) + roughnessSq );
    float GGX = GGXV + GGXL;
    float Vis = ( 0.0 < GGX ) ? ( 0.5 / GGX ) : 0.0;

    float f = ( aI.dotNH * roughnessSq - aI.dotNH ) * aI.dotNH + 1.0;
    float D = roughnessSq / ( PI * f * f );

    vec3 diffuse = max( vec3( 0.0 ), ( 1.0 - F ) * ( isect.albedo / PI ) );
    vec3 spec = max( vec3( 0.0 ), F * Vis * D );
    vec3 shade = shadow * aI.dotNL * ( diffuse + spec );

#ifdef IS_FIRST_LIGHT
    vec3 refl = reflect( aI.V, isect.normal );
    vec2 envCoord = vec2(
      0.5 + atan( refl.z, refl.x ) / TAU,
      0.5 + atan( refl.y, length( refl.zx ) ) / PI
    );
    vec2 brdf = texture2D( samplerBRDFLUT, vec2( aI.dotNV, 1.0 - roughness ) ).xy;

    vec3 texEnv = 0.2 * pow( texture2D( samplerEnv, envCoord ).rgb, vec3( 2.2 ) );
    shade += texEnv * ( brdf.x * F0 + brdf.y );
#endif // IS_FIRST_LIGHT

    shade += emissive * aI.dotNV * isect.albedo;

    gl_FragColor = vec4( PI * shade, 1.0 );

    return;

  }
}
