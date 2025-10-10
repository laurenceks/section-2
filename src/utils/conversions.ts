export const makeToAlwaysLater = (
    from: Date | string | number,
    to: Date | string | number,
    allowEqual: boolean = true
) => {
    const fromObj = convertToDate(from);
    const toObj = convertToDate(to);
    const fromTime = fromObj.getTime();
    const toTime = toObj.getTime();

    if (fromTime > toTime || (fromTime === toTime && !allowEqual)) {
        toObj.setDate(toObj.getDate() + 1);
    }
    return { fromObj, toObj };
};
export const convertToDate = (val: Date | string | number) =>
    val instanceof Date ? val : new Date(val);
export const convertToNumber = (val: Date | string | number) =>
    typeof val === "number" ? val : convertToDate(val).getTime();
