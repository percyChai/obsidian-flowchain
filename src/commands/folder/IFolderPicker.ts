export interface IFolderPicker {
	pickFolder(): Promise<string | null>;
}