// == import various modules / stuff ===============================================================
import './styles/main.scss';
import { ClockRealtime, ExpSmooth, Swap, Vector3 } from '@fms-cat/experimental';
import { Background } from './entities/Background';
import { BigWords } from './entities/BigWords';
import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import CONFIG from './config.json';
import { CameraEntity } from './entities/CameraEntity';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Consooru } from './entities/Consooru';
import { DISPLAY } from './heck/DISPLAY';
import { Dog } from './heck/Dog';
import { EVENTMAN } from './utils/EventManager';
import { Entity } from './heck/Entity';
import { ErrorLayer } from './entities/ErrorLayer';
import { Glitch } from './entities/Glitch';
import { HotPlane } from './entities/HotPlane';
import { Lambda } from './heck/components/Lambda';
import { LightEntity } from './entities/LightEntity';
import { MIDIMAN } from './utils/MidiManager';
import { Material } from './heck/Material';
import { Post } from './entities/Post';
import { RandomTexture } from './utils/RandomTexture';
import { Raymarcher } from './entities/Raymarcher';
import { ScreenCaptureTexture } from './utils/ScreenCaptureTexture';
import { SphereParticles } from './entities/SphereParticles';
import { Trails } from './entities/Trails';
import { UIParticles } from './entities/UIParticles';
import { Waku } from './entities/Waku';

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

const captureTexture = new ScreenCaptureTexture(
  DISPLAY.glCat
);
// captureTexture.texture.textureFilter( GL.NEAREST );
captureTexture.setup( CONFIG.screenReso[ 0 ], CONFIG.screenReso[ 1 ] );

// == Sir Glitchael Oneshotson =====================================================================
const sirGlitch = new ExpSmooth();
sirGlitch.factor = 10.0;

// == scene ========================================================================================
const dog = new Dog( {
  clock: new ClockRealtime(),
  root: new Entity()
} );
dog.clock.play();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( () => {
  randomTexture.update();
  captureTexture.update();
} ) );

// -- "objects" ------------------------------------------------------------------------------------
const waku = new Waku();
dog.root.children.push( waku.entity );

const errorLayer = new ErrorLayer();
dog.root.children.push( errorLayer.entity );
EVENTMAN.on( 'error', ( e ) => {
  errorLayer.setText( e );
} );
EVENTMAN.on( 'info', () => {
  errorLayer.resolve();
} );

const trails = new Trails( {
  trails: 4096,
  trailLength: 64,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( trails.entity );

const sphereParticles = new SphereParticles( {
  particlesSqrt: 256,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( sphereParticles.entity );

const uiParticles = new UIParticles( {
  particlesSqrt: 16,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( uiParticles.entity );

const consooru = new Consooru( {
  particlesSqrt: 16,
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( consooru.entity );
EVENTMAN.on( 'error', () => {
  consooru.error( 'Failed to compile a shader' );
} );
EVENTMAN.on( 'info', ( text ) => {
  consooru.info( text );
} );
EVENTMAN.on( 'regenerate', () => {
  consooru.info( 'Regenerate textures' );
} );
consooru.info( 'Ready' );
consooru.info( `Resolution: ${ CONFIG.resolution[ 0 ] }x${ CONFIG.resolution[ 1 ] }` );

const hotPlane = new HotPlane();
hotPlane.material.addUniformTexture( 'samplerRandom', randomTexture.texture );
hotPlane.material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
hotPlane.material.addUniformTexture( 'samplerCapture', captureTexture.texture );
dog.root.children.push( hotPlane.entity );

const background = new Background();
dog.root.children.push( background.entity );

const raymarcher = new Raymarcher( {
  textureRandom: randomTexture.texture,
  textureRandomStatic: randomTextureStatic.texture
} );
dog.root.children.push( raymarcher.entity );

// -- things that is not an "object" ---------------------------------------------------------------
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
  shadowMapFov: 90.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0
} );
light.color = [ 60.0, 60.0, 60.0 ];
light.entity.transform.lookAt( new Vector3( [ -1.0, 2.0, 8.0 ] ) );
dog.root.children.push( light.entity );

// const light2 = new LightEntity( {
//   root: dog.root,
//   shadowMapFov: 90.0,
//   shadowMapNear: 1.0,
//   shadowMapFar: 20.0
// } );
// light2.color = [ 50.0, 30.0, 40.0 ];
// light2.entity.transform.lookAt( new Vector3( [ -4.0, -2.0, 6.0 ] ) );
// dog.root.children.push( light2.entity );

const camera = new CameraEntity( {
  root: dog.root,
  target: swap.o,
  lights: [
    light,
    // light2
  ],
  textureRandom: randomTexture.texture
} );
camera.camera.clear = [ 0.0, 0.0, 0.0, 0.0 ];
camera.entity.components.push( new Lambda( ( event ) => {
  const t1 = 0.02 * Math.sin( event.time ) + MIDIMAN.midi( 'cameraRotX' ) - 0.5;
  const s1 = Math.sin( t1 );
  const c1 = Math.cos( t1 );
  const t2 = 0.02 * Math.cos( event.time ) + MIDIMAN.midi( 'cameraRotY' ) - 0.5;
  const s2 = Math.sin( t2 );
  const c2 = Math.cos( t2 );
  const r = 9.0 * MIDIMAN.midi( 'cameraRadius' );

  camera.entity.transform.lookAt( new Vector3( [
    r * c1 * s2,
    r * s1,
    r * c1 * c2
  ] ) );
} ) );
MIDIMAN.setSmoothFactor( 'cameraRotX', 10.0 );
MIDIMAN.setSmoothFactor( 'cameraRotY', 10.0 );
MIDIMAN.setSmoothFactor( 'cameraRadius', 10.0 );
dog.root.children.push( camera.entity );

const bigWords = new BigWords( {
  target: swap.o,
  width: CONFIG.resolution[ 0 ],
  height: CONFIG.resolution[ 1 ]
} );
dog.root.children.push( bigWords.entity );
EVENTMAN.on( 'words', ( words ) => {
  bigWords.words = new Set( words );
} );

swap.swap();
const bloom = new Bloom( {
  input: swap.i.texture,
  target: swap.o
} );
dog.root.children.push( bloom.entity );

swap.swap();
const glitch = new Glitch( {
  input: swap.i.texture,
  target: swap.o
} );
glitch.entity.components.unshift( new Lambda( ( event ) => {
  sirGlitch.update( event.deltaTime );
  glitch.material.addUniform( 'sirGlitch', '1f', sirGlitch.value );
} ) );
dog.root.children.push( glitch.entity );

swap.swap();
const post = new Post( {
  input: swap.i.texture,
  target: canvasRenderTarget
} );
dog.root.children.push( post.entity );

// == midi =========================================================================================
dog.root.components.push( new Lambda( ( event ) => {
  MIDIMAN.update( event.deltaTime );
} ) );

MIDIMAN.midi( 'oneshotGlitch' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'oneshotGlitch' && 0.5 < event.value ) {
    sirGlitch.value = 1.0;
  }
} );

MIDIMAN.midi( 'applyShaders' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'applyShaders' && 0.5 < event.value ) {
    Material.applyCuePrograms();
  }
} );

MIDIMAN.midi( 'changeBigWords' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'changeBigWords' && 0.5 < event.value ) {
    bigWords.draw();
  }
} );

MIDIMAN.midi( 'toggleBigWords' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'toggleBigWords' && 0.5 < event.value ) {
    bigWords.entity.active = !bigWords.entity.active;
    bigWords.entity.visible = !bigWords.entity.visible;
  }
} );

MIDIMAN.midi( 'resetTime' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'resetTime' && 0.5 < event.value ) {
    dog.clock.setTime( 0 );
    consooru.info( 'Reset global time' );
  }
} );

MIDIMAN.midi( 'regenerate' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'regenerate' && 0.5 < event.value ) {
    EVENTMAN.emitRegenerate();
  }
} );

MIDIMAN.midi( 'toggleUI' );
MIDIMAN.on( 'paramChange', ( event ) => {
  if ( event.key === 'toggleUI' && 0.5 < event.value ) {
    const divUI = $<HTMLDivElement>( '#divUI' )!;
    divUI.style.display = divUI.style.display === 'block' ? 'none' : 'block';
  }
} );

// == keyboard is good =============================================================================
const checkboxActive = $<HTMLInputElement>( '#active' )!;

window.addEventListener( 'keydown', ( event ) => {
  if ( event.which === 27 ) { // panic button
    dog.root.active = false;
    checkboxActive.checked = false;
  }
} );

checkboxActive.addEventListener( 'input', ( event: any ) => {
  dog.root.active = event.target.checked;
} );
