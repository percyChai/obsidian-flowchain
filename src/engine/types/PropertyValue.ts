export type PropertyValue =
	| string
	| number
	| boolean
	| null
	| PropertyValue[]
	| { [key: string]: PropertyValue };