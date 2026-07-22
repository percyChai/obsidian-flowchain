import type { LayoutScoreWeights }
	from "./LayoutScoreWeights";


export const LayoutScoreProfiles: {
	Medical: LayoutScoreWeights;
	Knowledge: LayoutScoreWeights;
	General: LayoutScoreWeights;
} = {


	Medical:
		{
			crossing: 50,

			compactness: 0.02,

			edgeLength: 0.01,

			balance: 0.5,

			backbone: 10

		},



	Knowledge:
		{
			crossing: 40,

			compactness: 0.05,

			edgeLength: 0.02,

			balance: 2,

			backbone: 5

		},



	General:
		{
			crossing: 30,

			compactness: 0.1,

			edgeLength: 0.05,

			balance: 1,

			backbone: 2

		}

};
