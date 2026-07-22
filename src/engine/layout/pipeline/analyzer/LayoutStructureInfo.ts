import type { EdgePriority } from "./EdgePriority";

export interface LayoutStructureInfo {


	/**
	 * Node importance.
	 */
	nodeImportance:
		Map<string, number>;



	/**
	 * Edge importance.
	 */
	edgeImportance:
		Map<string, number>;



	/**
	 * Edge priority level.
	 *
	 * Higher priority edges
	 * should have stronger influence
	 * on layout.
	 */
	edgePriority:
		Map<string, EdgePriority>;



	/**
	 * Visual backbone chains.
	 */
	mainChains:
		string[][];



	/**
	 * Nodes with multiple parents.
	 */
	convergenceNodes:
		Set<string>;
}