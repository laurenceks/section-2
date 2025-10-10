import { convertToNumber } from "./conversions";
import { formatDate } from "./formatDates";
import bankHolidays from "../data/bankHolidays";

export const calculateShiftLength = (
    from: Date | string | number,
    to: Date | string | number
) => {
    return convertToNumber(to) - convertToNumber(from);
};
export const calculateShiftHours = (
    from: Date | string | number,
    to: Date | string | number,
    breakOverrideMs: number | null = null
) => {
    const shiftLength = calculateShiftLength(from, to);
    if (breakOverrideMs === null || breakOverrideMs === undefined) {
        return shiftLength > 21600000 ? shiftLength - 1800000 : shiftLength;
    }
    return Math.max(shiftLength - breakOverrideMs, 0);
};

export const isBankHoliday = (date: Date) => {
    const lookupDate = formatDate(date, "sorting");
    return bankHolidays["england-and-wales"].events.some(
        (bh) => bh.date === lookupDate
    );
};
