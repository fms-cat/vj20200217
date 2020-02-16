import { Mesh, MeshCull } from '../heck/components/Mesh';
import { TRIANGLE_STRIP_QUAD, Vector3 } from '@fms-cat/experimental';
import { DISPLAY } from '../heck/DISPLAY';
import { DrawLambda } from '../heck/components/DrawLambda';
import { Entity } from '../heck/Entity';
import { GL } from '@fms-cat/glcat-ts';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Shaders } from '../shaders';

export class Raymarcher {
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
    this.__entity.transform.position = new Vector3( [ 0.0, 0.0, 0.3 ] );
    this.__entity.transform.scale = new Vector3( [ 16.0, 9.0, 1.0 ] ).scale( 0.15 );

    this.__geometry = this.__createGeoemtry();
    this.__material = this.__createMaterial();

    this.__material.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );

    this.__entity.components.push( new DrawLambda( ( event ) => {
      this.__material.addUniform(
        'cameraNearFar',
        '2f',
        event.camera.near,
        event.camera.far
      );

      this.__material.addUniformVector(
        'inversePV',
        'Matrix4fv',
        event.projectionMatrix.multiply( event.viewMatrix ).inverse!.elements
      );
    } ) );

    this.__mesh = new Mesh( this.__geometry, this.__material );
    this.__mesh.cull = MeshCull.None;
    this.__entity.components.push( this.__mesh );
  }

  protected __createGeoemtry(): Geometry {
    const geometry = new Geometry();

    const bufferPos = DISPLAY.glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );
    geometry.addAttribute( 'p', {
      buffer: bufferPos,
      size: 2,
      type: GL.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = GL.TRIANGLE_STRIP;

    return geometry;
  }

  protected __createMaterial(): Material {
    const material = new Material(
      Shaders.quadVert,
      require( '../shaders/raymarcher.frag' ).default
    );

    if ( module.hot ) {
      module.hot.accept( '../shaders/raymarcher.frag', () => {
        material.cueShader(
          Shaders.quadVert,
          require( '../shaders/raymarcher.frag' ).default
        );
      } );
    }

    return material;
  }
}
