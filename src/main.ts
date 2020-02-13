// == import various modules / stuff ===============================================================
import './styles/main.scss';
import { ClockRealtime, Swap, Vector3 } from '@fms-cat/experimental';
import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import CONFIG from './config.json';
import { CameraEntity } from './entities/CameraEntity';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { DISPLAY } from './heck/DISPLAY';
import { Dog } from './heck/Dog';
import { ERRORMAN } from './utils/ERRORMAN';
import { Entity } from './heck/Entity';
import { ErrorLayer } from './entities/ErrorLayer';
import { HotPlane } from './entities/HotPlane';
import { Lambda } from './heck/components/Lambda';
import { LightEntity } from './entities/LightEntity';
import { Post } from './entities/Post';
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

const errorLayer = new ErrorLayer();
dog.root.children.push( errorLayer.entity );
errorLayer.entity.transform.position = new Vector3( [ 0.0, 0.0, 1.0 ] );
errorLayer.entity.transform.scale = new Vector3( [ 2.0, 1.0, 1.0 ] );
ERRORMAN.on( 'error', ( e ) => {
  errorLayer.setText( e );
} );

const trails = new Trails( {
  trails: 4096,
  trailLength: 64,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( trails.entity );

const uiParticles = new UIParticles( {
  particlesSqrt: 8,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( uiParticles.entity );

const hotPlane = new HotPlane();
hotPlane.material.addUniformTexture( 'samplerRandom', randomTexture.texture );
hotPlane.material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
dog.root.children.push( hotPlane.entity );

const swapOptions = {
  width: canvasRenderTarget.width,
  height: canvasRenderTarget.height
};

const swap = new Swap(
  new BufferRenderTarget( swapOptions ),
  new BufferRenderTarget( swapOptions )
);

const light = new LightEntity( {
  root: dog.root,
  shadowMapFov: 40.0,
  shadowMapNear: 1.0,
  shadowMapFar: 40.0
} );
light.color = [ 30.0, 40.0, 50.0 ];
light.entity.transform.lookAt( new Vector3( [ 2.0, 4.0, 6.0 ] ) );
dog.root.children.push( light.entity );

const light2 = new LightEntity( {
  root: dog.root,
  shadowMapFov: 40.0,
  shadowMapNear: 1.0,
  shadowMapFar: 40.0
} );
light2.color = [ 50.0, 30.0, 40.0 ];
light2.entity.transform.lookAt( new Vector3( [ -4.0, -2.0, 6.0 ] ) );
dog.root.children.push( light2.entity );

const camera = new CameraEntity( {
  root: dog.root,
  target: swap.o,
  lights: [
    light,
    light2
  ]
} );
camera.entity.transform.lookAt( new Vector3( [ 0.0, 0.0, 5.0 ] ) );
camera.camera.clear = [ 0.0, 0.0, 0.0, 0.0 ];
camera.entity.components.push( new Lambda( ( event ) => {
  camera.entity.transform.lookAt( new Vector3( [
    5.0 * Math.sin( 0.1 * Math.sin( event.time ) ),
    0.0,
    5.0 * Math.cos( 0.1 * Math.sin( event.time ) )
  ] ) );
} ) );
dog.root.children.push( camera.entity );
swap.swap();

const bloom = new Bloom( {
  input: swap.i.texture,
  target: swap.o
} );
dog.root.children.push( bloom.entity );
swap.swap();

const post = new Post( {
  input: swap.i.texture,
  target: canvasRenderTarget
} );
dog.root.children.push( post.entity );

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
