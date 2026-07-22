import type { ILayout }
	from "../ILayout";
import type { LayoutType }
	from "../LayoutType";

import type { LayoutPreset }
	from "./LayoutPreset";


export interface LayoutVariant {
	id: string;


	name: string;

	description: string;

	layoutType: LayoutType;

	presetId?: string;


	preset?: LayoutPreset;


	layout?: ILayout;

}
