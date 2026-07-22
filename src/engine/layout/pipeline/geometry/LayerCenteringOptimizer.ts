import type { IGraph } from "../../../graph/IGraph";
import type { EntityPosition } from "../../EntityPosition";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { ILayoutOptimizer } from "../ILayoutOptimizer";

const LAYER_TOLERANCE = 1;
const MAX_LAYER_OFFSET = 160;

interface LayoutLayer {
	y: number;

	entries: Array<[
		string,
		EntityPosition
	]>;
}

export class LayerCenteringOptimizer
	implements ILayoutOptimizer {

	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot
	): GraphSnapshot {
		void graph;

		if (snapshot.positions.size === 0) {
			return snapshot;
		}

		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);

		const layers =
			this.collectLayers(positions);

		const graphCenterX =
			this.getGraphCenterX(positions);

		for (const layer of layers) {
			const layerCenterX =
				this.getLayerCenterX(layer);

			const requestedOffset =
				graphCenterX - layerCenterX;

			const safeOffset =
				Math.max(
					-MAX_LAYER_OFFSET,
					Math.min(
						MAX_LAYER_OFFSET,
						requestedOffset
					)
				);

			if (
				Math.abs(safeOffset) <
				LAYER_TOLERANCE
			) {
				continue;
			}

			for (
				const [entityId, position]
				of layer.entries
			) {
				positions.set(
					entityId,
					{
						...position,
						x:
							position.x +
							safeOffset
					}
				);
			}
		}

		return {
			...snapshot,
			positions
		};
	}

	private collectLayers(
		positions:
			ReadonlyMap<string, EntityPosition>
	): LayoutLayer[] {
		const layers: LayoutLayer[] = [];

		for (
			const [entityId, position]
			of positions
		) {
			const existingLayer =
				layers.find(
					(layer) =>
						Math.abs(
							layer.y -
							position.y
						) <=
						LAYER_TOLERANCE
				);

			if (existingLayer) {
				existingLayer.entries.push([
					entityId,
					position
				]);

				continue;
			}

			layers.push({
				y: position.y,
				entries: [
					[
						entityId,
						position
					]
				]
			});
		}

		return layers;
	}

	private getGraphCenterX(
		positions:
			ReadonlyMap<string, EntityPosition>
	): number {
		const values =
			Array.from(positions.values());

		const left =
			Math.min(
				...values.map(
					(position) =>
						position.x
				)
			);

		const right =
			Math.max(
				...values.map(
					(position) =>
						position.x +
						position.width
				)
			);

		return (left + right) / 2;
	}

	private getLayerCenterX(
		layer: LayoutLayer
	): number {
		const left =
			Math.min(
				...layer.entries.map(
					([, position]) =>
						position.x
				)
			);

		const right =
			Math.max(
				...layer.entries.map(
					([, position]) =>
						position.x +
						position.width
				)
			);

		return (left + right) / 2;
	}
}