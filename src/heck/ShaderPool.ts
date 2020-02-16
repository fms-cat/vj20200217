import { DISPLAY } from './DISPLAY';
import { GLCatProgram } from '@fms-cat/glcat-ts';
import { Material } from './Material';

export class ShaderPool<TUser> {
  private __programMap: Map<string, GLCatProgram> = new Map();

  private __ongoingPromises: Map<string, Promise<GLCatProgram>> = new Map();

  private __programUsersMap: Map<GLCatProgram, Set<TUser>> = new Map();

  public getProgram( vert: string, frag: string, user: TUser ): GLCatProgram {
    let program = this.__programMap.get( vert + frag );
    if ( !program ) {
      program = DISPLAY.glCat.lazyProgram( vert, frag );
      this.__programMap.set( vert + frag, program );
    }

    this.__setUser( program, user );

    return program;
  }

  public async getProgramAsync( vert: string, frag: string, user: TUser ): Promise<GLCatProgram> {
    let program = this.__programMap.get( vert + frag );
    if ( !program ) {
      let promise = this.__ongoingPromises.get( vert + frag );
      if ( !promise ) {
        promise = DISPLAY.glCat.lazyProgramAsync( vert, frag );
        promise.then( ( program ) => {
          this.__programMap.set( vert + frag, program );
          this.__ongoingPromises.delete( vert + frag );
        } );
        this.__ongoingPromises.set( vert + frag, promise );
      }

      program = await promise;
    }

    this.__setUser( program, user );

    return program;
  }

  public discardProgram(
    vert: string,
    frag: string,
    user: TUser
  ): void {
    const program = this.__programMap.get( vert + frag )!;

    this.__deleteUser( program, user );

    if ( this.__countUsers( program ) === 0 ) {
      program.dispose( true );
      this.__programMap.delete( vert + frag );
    }
  }

  private __setUser( program: GLCatProgram, user: TUser ): void {
    let users = this.__programUsersMap.get( program );
    if ( !users ) {
      users = new Set();
      this.__programUsersMap.set( program, users );
    }

    if ( !users.has( user ) ) {
      users.add( user );
    }
  }

  private __deleteUser( program: GLCatProgram, user: TUser ): void {
    const users = this.__programUsersMap.get( program )!;

    if ( !users.has( user ) ) {
      throw new Error( 'Attempt to delete an user of the program but the specified user is not an owner' );
    }
    users.delete( user );
  }

  private __countUsers( program: GLCatProgram ): number {
    const users = this.__programUsersMap.get( program )!;
    return users.size;
  }
}

export const SHADERPOOL = new ShaderPool<Material>();
