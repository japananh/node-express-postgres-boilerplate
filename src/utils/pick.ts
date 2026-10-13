/**
 * Create an object composed of the picked object properties
 */
const pick = <T extends object>(
	object: T | undefined | null,
	keys: string[]
): Partial<T> => {
	return keys.reduce((obj, key) => {
		if (object && Object.prototype.hasOwnProperty.call(object, key)) {
			// eslint-disable-next-line no-param-reassign
			obj[key as keyof T] = object[key as keyof T];
		}
		return obj;
	}, {} as Partial<T>);
};

export default pick;
