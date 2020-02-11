import { Mesh, MeshCull } from '../heck/components/Mesh';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@fms-cat/experimental';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GL } from '@fms-cat/glcat-ts';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Shaders } from '../shaders';

export class HotPlane {
  private __mesh: Mesh;
  private __geometry: Geometry;

  private __material: Material;

  public get material(): Material {
    return this.__material;
  }

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor() {
    this.__entity = new Entity();

    this.__geometry = this.__createGeoemtry();
    this.__material = this.__createMaterial();

    this.__mesh = new Mesh( this.__geometry, this.__material );
    this.__mesh.cull = MeshCull.None;
    this.__entity.components.push( this.__mesh );
  }

  protected __createGeoemtry(): Geometry {
    const geometry = new Geometry();

    const bufferPos = DISPLAY.glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );
    geometry.addAttribute( 'position', {
      buffer: bufferPos,
      size: 3,
      type: GL.FLOAT
    } );

    const bufferNor = DISPLAY.glCat.createBuffer();
    bufferNor.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );
    geometry.addAttribute( 'normal', {
      buffer: bufferNor,
      size: 3,
      type: GL.FLOAT
    } );

    const bufferUv = DISPLAY.glCat.createBuffer();
    bufferUv.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );
    geometry.addAttribute( 'uv', {
      buffer: bufferUv,
      size: 2,
      type: GL.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = DISPLAY.gl.TRIANGLE_STRIP;

    return geometry;
  }

  protected __createMaterial(): Material {
    const material = new Material(
      Shaders.objectVert,
      require( '../shaders/fuck.frag' ).default
    );
    material.blend = [ GL.ONE, GL.ZERO ];

    if ( module.hot ) {
      module.hot.accept( '../shaders/fuck.frag', () => {
        material.compileShaderAsync(
          Shaders.objectVert,
          require( '../shaders/fuck.frag' ).default,
          true,
          false,
          true
        ).catch( ( e ) => {
          console.error( e );
        } );
      } );
    }

    return material;
  }
}
