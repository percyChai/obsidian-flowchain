import type { EntityPosition } from "../../../EntityPosition";
import {
	EdgeOrientation
} from "../semantic/EdgeOrientation";
import type { EdgePorts } from "./EdgePorts";
import type { IEdgePortSelector } from "./IEdgePortSelector";

export class EdgePortSelector
	implements IEdgePortSelector {

	select(
		orientation: EdgeOrientation,
		from: EntityPosition,
		to: EntityPosition
	): EdgePorts {

		switch (orientation) {

			case EdgeOrientation.Horizontal:
				return this.selectHorizontal(
					from,
					to
				);

			case EdgeOrientation.Radial:
				return this.selectRadial(
					from,
					to
				);

			case EdgeOrientation.Vertical:
			default:
				return this.selectVertical(
					from,
					to
				);
		}
	}

	private selectVertical(
		from: EntityPosition,
		to: EntityPosition
	): EdgePorts {

		if (to.y >= from.y) {
			return {
				fromPort: "bottom",
				toPort: "top"
			};
		}

		return {
			fromPort: "top",
			toPort: "bottom"
		};
	}

	private selectHorizontal(
		from: EntityPosition,
		to: EntityPosition
	): EdgePorts {

		if (to.x >= from.x) {
			return {
				fromPort: "right",
				toPort: "left"
			};
		}

		return {
			fromPort: "left",
			toPort: "right"
		};
	}

	private selectRadial(
		from: EntityPosition,
		to: EntityPosition
	): EdgePorts {

		const dx =
			to.x - from.x;

		const dy =
			to.y - from.y;

		if (Math.abs(dx) >= Math.abs(dy)) {
			return this.selectHorizontal(
				from,
				to
			);
		}

		return this.selectVertical(
			from,
			to
		);
	}
}