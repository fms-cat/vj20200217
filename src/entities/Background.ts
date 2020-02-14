import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Shaders } from '../shaders';
import { genOctahedron } from '../geometries/genOctahedron';

export class Background {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor() {
    this.__entity = new Entity();

    const geometry = genOctahedron( { div: 6, radius: -10.0 } );

    const material = new Material(
      Shaders.objectVert,
      require( '../shaders/background.frag' ).default
    );

    if ( module.hot ) {
      module.hot.accept( '../shaders/background.frag', () => {
        material.compileShaderAsync(
          Shaders.objectVert,
          require( '../shaders/background.frag' ).default
        );
      } );
    }

    const mesh = new Mesh( geometry, material );
    mesh.cull = MeshCull.None;
    this.__entity.components.push( mesh );

    this.__entity.components.push( new Lambda( ( event ) => {
      this.__entity.transform.rotation = Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.7, 0.2 ] ).normalized,
        0.1 * event.time
      );
    } ) );
  }
}
