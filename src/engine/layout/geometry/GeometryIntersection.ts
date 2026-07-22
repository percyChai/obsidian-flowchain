import type { EntityPosition } from "../EntityPosition";
import type { EdgePathPoint } from "../pipeline/routing/path/EdgePathPoint";

export class GeometryIntersection {
	static pathIntersectsRectangle(
		points: readonly EdgePathPoint[],
		rectangle: EntityPosition
	): boolean {
		for (
			let index = 0;
			index < points.length - 1;
			index++
		) {
			const start = points[index];
			const end = points[index + 1];

			if (!start || !end) {
				continue;
			}

			if (
				this.segmentIntersectsRectangle(
					start,
					end,
					rectangle
				)
			) {
				return true;
			}
		}

		return false;
	}

	static segmentIntersectsRectangle(
		start: EdgePathPoint,
		end: EdgePathPoint,
		rectangle: EntityPosition
	): boolean {
		const left = rectangle.x;
		const right =
			rectangle.x + rectangle.width;
		const top = rectangle.y;
		const bottom =
			rectangle.y + rectangle.height;

		if (
			this.pointInsideRectangle(
				start,
				rectangle
			) ||
			this.pointInsideRectangle(
				end,
				rectangle
			)
		) {
			return true;
		}

		const topLeft: EdgePathPoint = {
			x: left,
			y: top
		};

		const topRight: EdgePathPoint = {
			x: right,
			y: top
		};

		const bottomRight: EdgePathPoint = {
			x: right,
			y: bottom
		};

		const bottomLeft: EdgePathPoint = {
			x: left,
			y: bottom
		};

		return (
			this.segmentsIntersect(
				start,
				end,
				topLeft,
				topRight
			) ||
			this.segmentsIntersect(
				start,
				end,
				topRight,
				bottomRight
			) ||
			this.segmentsIntersect(
				start,
				end,
				bottomRight,
				bottomLeft
			) ||
			this.segmentsIntersect(
				start,
				end,
				bottomLeft,
				topLeft
			)
		);
	}

	static pointInsideRectangle(
		point: EdgePathPoint,
		rectangle: EntityPosition
	): boolean {
		return (
			point.x >= rectangle.x &&
			point.x <=
				rectangle.x + rectangle.width &&
			point.y >= rectangle.y &&
			point.y <=
				rectangle.y + rectangle.height
		);
	}

	static segmentsIntersect(
		firstStart: EdgePathPoint,
		firstEnd: EdgePathPoint,
		secondStart: EdgePathPoint,
		secondEnd: EdgePathPoint
	): boolean {
		const firstOrientation =
			this.orientation(
				firstStart,
				firstEnd,
				secondStart
			);

		const secondOrientation =
			this.orientation(
				firstStart,
				firstEnd,
				secondEnd
			);

		const thirdOrientation =
			this.orientation(
				secondStart,
				secondEnd,
				firstStart
			);

		const fourthOrientation =
			this.orientation(
				secondStart,
				secondEnd,
				firstEnd
			);

		if (
			firstOrientation !== secondOrientation &&
			thirdOrientation !== fourthOrientation
		) {
			return true;
		}

		if (
			firstOrientation === 0 &&
			this.pointOnSegment(
				firstStart,
				secondStart,
				firstEnd
			)
		) {
			return true;
		}

		if (
			secondOrientation === 0 &&
			this.pointOnSegment(
				firstStart,
				secondEnd,
				firstEnd
			)
		) {
			return true;
		}

		if (
			thirdOrientation === 0 &&
			this.pointOnSegment(
				secondStart,
				firstStart,
				secondEnd
			)
		) {
			return true;
		}

		return (
			fourthOrientation === 0 &&
			this.pointOnSegment(
				secondStart,
				firstEnd,
				secondEnd
			)
		);
	}

	private static orientation(
		first: EdgePathPoint,
		second: EdgePathPoint,
		third: EdgePathPoint
	): number {
		const value =
			(second.y - first.y) *
				(third.x - second.x) -
			(second.x - first.x) *
				(third.y - second.y);

		if (Math.abs(value) < Number.EPSILON) {
			return 0;
		}

		return value > 0 ? 1 : 2;
	}

	private static pointOnSegment(
		start: EdgePathPoint,
		point: EdgePathPoint,
		end: EdgePathPoint
	): boolean {
		return (
			point.x <= Math.max(start.x, end.x) &&
			point.x >= Math.min(start.x, end.x) &&
			point.y <= Math.max(start.y, end.y) &&
			point.y >= Math.min(start.y, end.y)
		);
	}
}