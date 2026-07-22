import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";


export class EdgeCrossingEvaluator {


	evaluate(
		graph: IGraph,
		snapshot: GraphSnapshot
	): number {


		let crossings = 0;


		for (
			const routeA
			of snapshot.paths.values()
		) {


			for (
				const routeB
				of snapshot.paths.values()
			) {


				if (
					routeA === routeB
				) {
					continue;
				}


				if (
					this.intersects(
						routeA.points,
						routeB.points
					)
				) {

					crossings++;

				}
			}
		}


		return Math.floor(
			crossings / 2
		);
	}



	private intersects(
		a:
			readonly {x:number,y:number}[],
		b:
			readonly {x:number,y:number}[]
	): boolean {


		for (
			let i = 0;
			i < a.length - 1;
			i++
		) {


			const a1 =
				a[i];

			const a2 =
				a[i + 1];


			if (!a1 || !a2) {
				continue;
			}


			for (
				let j = 0;
				j < b.length - 1;
				j++
			) {


				const b1 =
					b[j];

				const b2 =
					b[j + 1];


				if (!b1 || !b2) {
					continue;
				}


				if (
					this.segmentCross(
						a1,
						a2,
						b1,
						b2
					)
				) {

					return true;

				}

			}

		}


		return false;
	}



	private segmentCross(
		a1:{x:number,y:number},
		a2:{x:number,y:number},
		b1:{x:number,y:number},
		b2:{x:number,y:number}
	):boolean {


		const cross =
			(p1:{x:number,y:number},
			 p2:{x:number,y:number},
			 p3:{x:number,y:number}) =>
			(
				(p2.x-p1.x) *
				(p3.y-p1.y)
				-
				(p2.y-p1.y) *
				(p3.x-p1.x)
			);


		return (
			cross(a1,a2,b1) *
			cross(a1,a2,b2)
			< 0
			&&
			cross(b1,b2,a1) *
			cross(b1,b2,a2)
			< 0
		);
	}
}