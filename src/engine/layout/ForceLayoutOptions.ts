export interface ForceLayoutOptions {
	nodeWidth: number;
	nodeHeight: number;
	componentGap: number;
	initialRadius: number;
	iterations: number;
	repulsionStrength: number;
	attractionStrength: number;
	centeringStrength: number;
	collisionStrength: number;
	idealEdgeLength: number;
	initialTemperature: number;
	cooling: number;
	convergenceThreshold: number;
}
