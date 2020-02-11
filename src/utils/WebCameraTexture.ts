import { GLCat, GLCatTexture } from '@fms-cat/glcat-ts';

export class WebCameraTexture {
  private __video: HTMLVideoElement;
  private __texture: GLCatTexture;

  constructor( glCat: GLCat ) {
    this.__video = document.createElement( 'video' );
    this.__texture = glCat.createTexture()!;
    this.__texture.setTextureFromArray( 1, 1, new Uint8Array( [ 255, 0, 255, 255 ] ) ); // heck
  }

  public get video() { return this.__video; }
  public get texture() { return this.__texture; }

  public setup( width: number, height: number ): Promise<GLCatTexture> {
    return ( navigator.mediaDevices as any ).getUserMedia(
      {
        video: { width, height },
      }
    ).then( ( stream: MediaStream ) => {
      this.__video.srcObject = stream;
      this.__video.play().then( () => {
        this.__texture.setTexture( this.__video );
        return this.__texture;
      } );
    } );
  }

  public update() {
    if ( !this.__video.paused ) {
      this.__texture.setTexture( this.__video );
    }
  }
}
