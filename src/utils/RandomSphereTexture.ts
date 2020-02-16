import { GL, GLCat, GLCatTexture } from '@fms-cat/glcat-ts';
import { Vector3, Xorshift } from '@fms-cat/experimental';

export class RandomSphereTexture {
  private __texture: GLCatTexture;
  private __array: Float32Array;
  private __rng: Xorshift;
  private __width: number;
  private __height: number;

  public constructor( glCat: GLCat, width: number, height: number = width ) {
    this.__width = width;
    this.__height = height;
    this.__rng = new Xorshift();
    this.__array = new Float32Array( width * height * 4 );
    this.__texture = glCat.createTexture()!;
    this.__texture.textureFilter( GL.NEAREST );
    this.__texture.textureWrap( GL.REPEAT );
  }

  public get texture(): GLCatTexture {
    return this.__texture;
  }

  public dispose(): void {
    this.__texture.dispose();
  }

  public update( seed?: number ): void {
    if ( seed ) { this.__rng.seed = seed; }

    const n = this.__array.length / 4;
    for ( let i = 0; i < n; i ++ ) {
      let vec: Vector3 | undefined = undefined;
      while ( !( vec && vec.length < 1.0 ) ) {
        vec = new Vector3( [
          this.__rng.gen() * 2.0 - 1.0,
          this.__rng.gen() * 2.0 - 1.0,
          this.__rng.gen() * 2.0 - 1.0
        ] );
      }

      this.__array[ i * 4 + 0 ] = vec.x;
      this.__array[ i * 4 + 1 ] = vec.y;
      this.__array[ i * 4 + 2 ] = vec.z;
      this.__array[ i * 4 + 3 ] = 1.0;
    }

    this.__texture.setTextureFromFloatArray(
      this.__width,
      this.__height,
      this.__array
    );
  }
}

export default RandomSphereTexture;
