/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** @packageDocumentation
 * @module WebGL
 */

import { dispose } from "@bentley/bentleyjs-core";
import { Range3d, Transform } from "@bentley/geometry-core";
import { PackedFeatureTable, Quantization } from "@bentley/imodeljs-common";
import { Mesh } from "../../render-primitives";
import { IndexedGeometry } from "../../webgl";
import { SimpleMeshGeometryParams, SimpleMeshPrimitive } from "../primitives/mesh/SimpleMeshPrimitive";
import { TerrainMeshPrimitive } from "../primitives/mesh/TerrainMeshPrimitive";
import { RenderGraphic } from "../RenderGraphic";
import { RenderMemory } from "../RenderMemory";
import { RenderSimpleMeshGeometry, RenderSystem } from "../RenderSystem";
import { GL } from "./GL";
import { RenderOrder, RenderPass } from "./RenderFlags";
import { System } from "./System";
import { Target } from "./Target";
import { TechniqueId } from "./TechniqueId";



/** @internal */
export class RealityMeshGeometry extends IndexedGeometry implements RenderSimpleMeshGeometry {
  public get asRealityMesh(): RealityMeshGeometry | undefined { return this; }
  public get isDisposed(): boolean { return this._meshParams.isDisposed; }
  public get uvQParams() { return this._meshParams.uvParams.params; }
  public get hasFeatures(): boolean { return this._meshParams.featureID !== undefined; }
  public get supportsThematicDisplay() { return true; }

  private constructor(private _meshParams: SimpleMeshGeometryParams, private readonly _transform: Transform | undefined) {
    super(_meshParams);
  }

  public dispose() {
    super.dispose();
    dispose(this._meshParams);
  }

  public static createGeometry(terrainMesh: TerrainMeshPrimitive, transform: Transform | undefined) {
    const params = SimpleMeshGeometryParams.createFromPrimitive(terrainMesh);
    return new RealityMeshGeometry(params!, transform);
  }
  public getRange(): Range3d {
    return Range3d.createXYZXYZ(this.qOrigin[0], this.qOrigin[1], this.qOrigin[2], this.qOrigin[0] + Quantization.rangeScale16 * this.qScale[0], this.qOrigin[1] + Quantization.rangeScale16 * this.qScale[1], this.qOrigin[2] + Quantization.rangeScale16 * this.qScale[2]);
  }

  public static createGraphic(_system: RenderSystem, _mesh: RealityMeshGeometry, _featureTable: PackedFeatureTable, _tileId: string): RenderGraphic | undefined {
    return undefined;
  }

  public collectStatistics(stats: RenderMemory.Statistics): void {
    stats.addRealityMesh(this._meshParams.bytesUsed);
  }

  public get techniqueId(): TechniqueId { return TechniqueId.RealityMesh; }

  public getRenderPass(_target: Target): RenderPass {
    return RenderPass.OpaqueGeneral;
  }
  public get renderOrder(): RenderOrder { return RenderOrder.UnlitSurface; }

  public draw(): void {
    this._params.buffers.bind();
    System.instance.context.drawElements(GL.PrimitiveType.Triangles, this._params.numIndices, GL.DataType.UnsignedShort, 0);
    this._params.buffers.unbind();
  }
}

export class RealityMeshPrimitive  extends SimpleMeshPrimitive implements RenderMemory.Consumer {
  public collectStatistics(stats: RenderMemory.Statistics): void {
    stats.addRealityMesh(this.bytesUsed);
    }
}