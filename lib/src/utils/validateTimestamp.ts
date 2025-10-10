const validTimestamp =
    /^(01|[2-9]\d)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) [0-2]\d(:[0-5]\d){1,2}$/;
// /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) [0-2]\d(:[0-5]\d){1,2}$/; full range, above is from 0100-01-01 00:00:00.000 to 9999-12-31 23:59:59.999 to prevent JS date object errors
const validIso =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;
export const validateTimestamp = (
    timestamp: string | number | Date
): boolean => {
    if (timestamp instanceof Date) {
        return !isNaN(timestamp.getTime());
    }
    if (typeof timestamp === "string") {
        return validTimestamp.test(timestamp) || validIso.test(timestamp);
    }
    return (
        Number.isSafeInteger(timestamp) &&
        Number(timestamp) <= 8640000000000000 &&
        Number(timestamp) >= -8640000000000000
    );
};
