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

export const validateTimestampParameters = (
    from: string | number | Date,
    planned_to: string | number | Date,
    actual_to?: string | number | Date | null
) => {
    if (
        !validateTimestamp(from) ||
        !validateTimestamp(planned_to) ||
        (!!actual_to && !validateTimestamp(actual_to))
    ) {
        console.warn(
            "Invalid datetime passed - function will return 0 for all fields. Datetimes must be a Date object, unix time or a string in yyyy-mm-dd or ISO format."
        );
        return false;
    }
    const fromObj = new Date(from);
    const plannedToObj = new Date(planned_to);
    const actualToObj = actual_to ? new Date(actual_to) : null;
    if (
        !(
            (!actualToObj || actualToObj >= plannedToObj) &&
            plannedToObj >= fromObj
        )
    ) {
        console.warn(
            "Invalid datetime passed - function will return 0 for all fields. Datetimes must be in ascending order (from <= planned_to <= actual_to || !actual_to)"
        );
        //times are out of sequence - return 0 for everything
        return false;
    }
    return true;
};
