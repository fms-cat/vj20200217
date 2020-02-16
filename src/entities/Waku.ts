import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { Plane } from './Plane';
import { Shaders } from '../shaders';
import { Vector3 } from '@fms-cat/experimental';

export class Waku {
  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor() {
    this.__entity = new Entity();

    const materialTop = new Material(
      Shaders.objectVert,
      require( '../shaders/waku.frag' ).default
    );

    const planeTop = new Plane( { material: materialTop } );
    planeTop.material.addUniform( 'uvScale', '2f', 2.5, 0.05 );
    planeTop.entity.transform.scale = new Vector3( [ 2.5, 0.05, 1.0 ] );
    planeTop.entity.transform.position = new Vector3( [ 0.0, 1.5, 1.0 ] );
    this.__entity.children.push( planeTop.entity );

    const materialBotttom = new Material(
      Shaders.objectVert,
      require( '../shaders/waku.frag' ).default
    );

    const planeBottom = new Plane( { material: materialBotttom } );
    planeBottom.material.addUniform( 'uvScale', '2f', -2.5, -0.05 );
    planeBottom.entity.transform.scale = new Vector3( [ 2.5, 0.05, 1.0 ] );
    planeBottom.entity.transform.position = new Vector3( [ 0.0, -1.5, 1.0 ] );
    this.__entity.children.push( planeBottom.entity );

    if ( module.hot ) {
      module.hot.accept( '../shaders/waku.frag', () => {
        materialTop.cueShader(
          Shaders.objectVert,
          require( '../shaders/waku.frag' ).default
        );

        materialBotttom.cueShader(
          Shaders.objectVert,
          require( '../shaders/waku.frag' ).default
        );
      } );
    }
  }
}
