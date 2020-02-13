import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { DISPLAY } from '../heck/DISPLAY';
import { Entity } from '../heck/Entity';
import { GL } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { LightEntity } from './LightEntity';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Shaders } from '../shaders';
import { loadImageTexture } from '../utils/loadImageTexture';

const textureEnv = DISPLAY.glCat.createTexture();
textureEnv.setZeroTexture();
loadImageTexture( {
  texture: textureEnv,
  url: require( '../images/luxo.png' ).default
} );

const textureBRDFLUT = DISPLAY.glCat.createTexture();
textureBRDFLUT.setZeroTexture();
loadImageTexture( {
  texture: textureBRDFLUT,
  url: require( '../images/brdf-lut.png' ).default
} );

export interface CameraEntityOptions {
  root: Entity;
  target: RenderTarget;
  lights: LightEntity[];
}

export class CameraEntity {
  private __root: Entity;

  public get root(): Entity {
    return this.__root;
  }

  private __camera: PerspectiveCamera;

  public get camera(): PerspectiveCamera {
    return this.__camera;
  }

  private __entity: Entity;

  public get entity(): Entity {
    return this.__entity;
  }

  public constructor( options: CameraEntityOptions ) {
    this.__root = options.root;

    this.__entity = new Entity();

    const cameraTarget = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      numBuffers: 4
    } );
    this.__camera = new PerspectiveCamera( {
      scene: this.__root,
      renderTarget: cameraTarget,
      near: 0.1,
      far: 20.0
    } );
    this.__entity.components.push( this.__camera );

    const shadingMaterials = options.lights.map( ( light, iLight ) => {
      const shadingMaterial = new Material(
        Shaders.quadVert,
        require( '../shaders/shading.frag' ).default,
        {
          IS_FIRST_LIGHT: iLight === 0 ? 'true' : undefined
        }
      );

      this.__entity.components.push( new Lambda( () => {
        shadingMaterial.addUniformVector(
          'viewMatrix',
          'Matrix4fv',
          this.__entity.transform.matrix.inverse!.elements
        );

        shadingMaterial.addUniform(
          'lightNearFar',
          '2f',
          light.camera.near,
          light.camera.far
        );

        shadingMaterial.addUniform(
          'cameraPos',
          '3f',
          ...this.__entity.transform.position.elements
        );

        shadingMaterial.addUniform(
          'lightPos',
          '3f',
          ...light.entity.transform.position.elements
        );

        shadingMaterial.addUniform(
          'lightColor',
          '3f',
          ...light.color
        );

        shadingMaterial.addUniformVector(
          'lightPV',
          'Matrix4fv',
          light.camera.projectionMatrix.multiply(
            light.entity.transform.matrix.inverse!
          ).elements
        );
      } ) );

      for ( let i = 0; i < 4; i ++ ) {
        shadingMaterial.addUniformTexture(
          'sampler' + i,
          cameraTarget.getTexture( GL.COLOR_ATTACHMENT0 + i )
        );
      }

      shadingMaterial.blend = [ GL.ONE, GL.ONE ];
      shadingMaterial.addUniformTexture( 'samplerShadow', light.shadowMap.texture );
      shadingMaterial.addUniformTexture( 'samplerBRDFLUT', textureBRDFLUT );
      shadingMaterial.addUniformTexture( 'samplerEnv', textureEnv );

      const shadingQuad = new Quad( {
        material: shadingMaterial,
        target: options.target
      } );
      shadingQuad.clear = iLight === 0 ? [] : false;
      this.__entity.components.push( shadingQuad );

      return shadingMaterial;
    } );

    if ( module.hot ) {
      module.hot.accept( '../shaders/shading.frag', () => {
        shadingMaterials.forEach( ( material ) => {
          material.compileShaderAsync(
            Shaders.quadVert,
            require( '../shaders/shading.frag' ).default,
            true,
            false,
            true
          );
        } );
      } );
    }
  }
}
