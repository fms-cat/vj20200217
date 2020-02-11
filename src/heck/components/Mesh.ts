import { Component, ComponentDrawEvent } from './Component';
import { DISPLAY } from '../DISPLAY';
import { GL } from '@fms-cat/glcat-ts';
import { Geometry } from '../Geometry';
import { Material } from '../Material';

export enum MeshCull {
  None,
  Front,
  Back,
  Both
}

const meshCullMap = {
  [ MeshCull.Front ]: GL.FRONT,
  [ MeshCull.Back ]: GL.BACK,
  [ MeshCull.Both ]: GL.FRONT_AND_BACK
};

export class Mesh extends Component {
  public geometry: Geometry;
  public material: Material;

  public cull: MeshCull = MeshCull.Back;

  public constructor( geometry: Geometry, material: Material ) {
    super();

    this.geometry = geometry;
    this.material = material;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    const glCat = DISPLAY.glCat;
    const gl = glCat.renderingContext;

    const originalVert = this.material.vert;
    if ( event.vertexOverride ) {
      this.material.vert = event.vertexOverride;
    }

    const originalFrag = this.material.frag;
    if ( event.fragmentOverride ) {
      this.material.frag = event.fragmentOverride;
    }

    const program = this.material.program;

    glCat.useProgram( program );
    this.material.setBlendMode();

    if ( this.cull === MeshCull.None ) {
      gl.disable( gl.CULL_FACE );
    } else {
      gl.enable( gl.CULL_FACE );
      gl.cullFace( meshCullMap[ this.cull ] );
    }

    this.geometry.assignBuffers( this.material );

    this.material.setUniforms();

    program.uniform1f( 'time', event.time );
    program.uniform1f( 'frameCount', event.frameCount );
    program.uniform2f( 'resolution', event.renderTarget.width, event.renderTarget.height );

    program.uniformMatrix4fv( 'modelMatrix', event.globalTransform.matrix.elements );
    program.uniformMatrix4fv( 'viewMatrix', event.viewMatrix.elements );
    program.uniformMatrix4fv( 'projectionMatrix', event.projectionMatrix.elements );

    this.geometry.draw();

    this.material.vert = originalVert;
    this.material.frag = originalFrag;
  }
}
