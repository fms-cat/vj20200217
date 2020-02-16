import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { genOctahedron } from '../geometries/genOctahedron';

export class Background {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor() {
    this.__entity = new Entity();

    const mesh = new Mesh(
      this.__createGeometry(),
      this.__createMaterial()
    );
    mesh.cull = MeshCull.None;
    this.__entity.components.push( mesh );

    this.__entity.components.push( new Lambda( ( event ) => {
      this.__entity.transform.rotation = Quaternion.fromAxisAngle(
        new Vector3( [ 1.0, 0.7, 0.2 ] ).normalized,
        0.1 * event.time
      );
    } ) );
  }

  private __createGeometry(): Geometry {
    const octahedron = genOctahedron( { div: 6, radius: -10.0 } );

    const geometry = new Geometry();

    geometry.addAttribute( 'position', octahedron.position );
    geometry.addAttribute( 'normal', octahedron.normal );
    geometry.setIndex( octahedron.index );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;

    return geometry;
  }

  private __createMaterial(): Material {
    const material = new Material(
      require( '../shaders/background.vert' ).default,
      require( '../shaders/background.frag' ).default
    );

    if ( module.hot ) {
      module.hot.accept( '../shaders/background.vert', () => {
        material.cueShader(
          require( '../shaders/background.vert' ).default,
          require( '../shaders/background.frag' ).default
        );
      } );

      module.hot.accept( '../shaders/background.frag', () => {
        material.cueShader(
          require( '../shaders/background.vert' ).default,
          require( '../shaders/background.frag' ).default
        );
      } );
    }

    return material;
  }
}
