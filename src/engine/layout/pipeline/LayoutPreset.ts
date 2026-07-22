import type { ILayout } from "../ILayout";


export interface LayoutPreset {


	name: string;


	create(): ILayout;

}