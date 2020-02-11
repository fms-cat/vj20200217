// == import various modules / stuff ===============================================================
import './styles/main.scss';
import { ClockRealtime, Vector3 } from '@fms-cat/experimental';
import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import CONFIG from './config.json';
import { CameraEntity } from './entities/CameraEntity';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { DISPLAY } from './heck/DISPLAY';
import { Dog } from './heck/Dog';
import { Entity } from './heck/Entity';
import { HotPlane } from './entities/HotPlane';
import { Lambda } from './heck/components/Lambda';
import { LightEntity } from './entities/LightEntity';
import RandomTexture from './utils/RandomTexture';
import { Trails } from './entities/Trails';
import { UIParticles } from './entities/UIParticles';

// == we are still struggling by this ==============================================================
function $<T extends Element>( selector: string ): T | null {
  return document.querySelector<T>( selector );
}

// == random texture ===============================================================================
const randomTexture = new RandomTexture(
  DISPLAY.glCat,
  CONFIG.randomReso[ 0 ],
  CONFIG.randomReso[ 1 ]
);
randomTexture.update();

const randomTextureStatic = new RandomTexture(
  DISPLAY.glCat,
  CONFIG.randomStaticReso[ 0 ],
  CONFIG.randomStaticReso[ 1 ]
);
randomTextureStatic.update();

// == scene ========================================================================================
const dog = new Dog( {
  clock: new ClockRealtime(),
  root: new Entity()
} );
dog.clock.play();

const canvasRenderTarget = new CanvasRenderTarget();

const entityRandomTextureUpdater = new Entity();
entityRandomTextureUpdater.components.push( new Lambda( () => {
  randomTexture.update();
} ) );
dog.root.children.push( entityRandomTextureUpdater );

const trails = new Trails( {
  trails: 1024,
  trailLength: 16,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( trails.entity );

const uiParticles = new UIParticles( {
  particlesSqrt: 32,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( uiParticles.entity );

const hotPlane = new HotPlane();
hotPlane.material.addUniformTexture( 'samplerRandom', randomTexture.texture );
hotPlane.material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
dog.root.children.push( hotPlane.entity );

const cameraTarget = new BufferRenderTarget( {
  width: canvasRenderTarget.width,
  height: canvasRenderTarget.height
} );

const light = new LightEntity( {
  root: dog.root,
  shadowMapFov: 40.0,
  shadowMapNear: 1.0,
  shadowMapFar: 40.0
} );
light.color = [ 40.0, 8.0, 0.0 ];
light.entity.transform.lookAt( new Vector3( [ 2.0, 4.0, 5.0 ] ) );
dog.root.children.push( light.entity );

const light2 = new LightEntity( {
  root: dog.root,
  shadowMapFov: 40.0,
  shadowMapNear: 1.0,
  shadowMapFar: 40.0
} );
light2.color = [ 0.0, 24.0, 48.0 ];
light2.entity.transform.lookAt( new Vector3( [ -4.0, -2.0, 5.0 ] ) );
dog.root.children.push( light2.entity );

const camera = new CameraEntity( {
  root: dog.root,
  target: cameraTarget,
  lights: [
    light,
    light2
  ]
} );
camera.entity.transform.lookAt( new Vector3( [ 0.0, 0.0, 5.0 ] ) );
camera.camera.clear = [ 0.0, 0.0, 0.0, 0.0 ];
dog.root.children.push( camera.entity );

const bloom = new Bloom( cameraTarget.texture, canvasRenderTarget );
dog.root.children.push( bloom.entity );

// == keyboard is good =============================================================================
const checkboxActive = $<HTMLInputElement>( '#active' )!;

window.addEventListener( 'keydown', ( event ) => {
  if ( event.which === 27 ) { // panic button
    dog.active = false;
    checkboxActive.checked = false;
  }
} );

checkboxActive.addEventListener( 'input', ( event: any ) => {
  dog.active = event.target.checked;
} );
