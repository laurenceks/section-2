import { makeToAlwaysLater } from "../utils/conversions";
import {
    AdditionalHours,
    AdditionHoursParams,
    Section2Shift,
    ShiftType,
} from "../types/section2";
import {
    absentShiftTypes,
    additionalHoursShiftTypes,
} from "../utils/shiftTypes";
import {
    calculateShiftHours,
    calculateShiftLength,
    isBankHoliday,
} from "../utils/shiftLengths";

export const calculateCumulativeAdditionalHours = (
    from: Date,
    shifts: Section2Shift[] = [],
    id?: string | number,
    employment_id?: string | number
) => {
    const prevMonday = new Date(from);
    prevMonday.setHours(0, 0, 0, 0);
    prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7));

    return shifts.reduce((acc, val) => {
        const valFrom = new Date(val.from);
        const valTo = makeToAlwaysLater(valFrom, val.actual_to).toObj;
        if (
            valFrom >= prevMonday &&
            valFrom < from &&
            ((!!id && !!val.id && id !== val.id) || (!id && !val.id)) &&
            ((!!employment_id &&
                !!val.employment_id &&
                employment_id === val.employment_id) ||
                (!employment_id && !val.employment_id))
        ) {
            if (additionalHoursShiftTypes.includes(val.type)) {
                return (
                    acc +
                    calculateShiftHours(valFrom, valTo, val.break_override)
                );
            } else if (val.overrun_type === "OT") {
                return (
                    acc +
                    calculateShiftHours(
                        makeToAlwaysLater(valFrom, val.planned_to).toObj,
                        valTo,
                        val.break_override
                    )
                );
            }
        }
        return acc;
    }, 0);
};

const calculateBankHolidayToil = (
    type: ShiftType,
    from: Date,
    to: Date,
    fromIsBankHoliday: boolean,
    toIsBankHoliday: boolean
) => {
    if (
        ["Normal", "OT", "TOIL"].includes(type) &&
        (fromIsBankHoliday || toIsBankHoliday)
    ) {
        if (fromIsBankHoliday && toIsBankHoliday) {
            return calculateShiftHours(from, to);
        } else if (fromIsBankHoliday) {
            //from time until midnight
            return calculateShiftLength(
                from,
                new Date(to).setHours(0, 0, 0, 0)
            );
        } else {
            //midnight until to time
            return calculateShiftLength(
                new Date(from).setHours(24, 0, 0, 0),
                to
            );
        }
    }
    return 0;
};

/**
 * Calculates Additional hours object containing calculated additional in ms
 *
 * @param shift - shift parameters for calculating
 * @param shift.id - the unique identifier of the shift, optional
 * @param shift.from - the Date object representing the start of the shift
 * @param shift.planned_to - the Date object representing of the planned end of the shift
 * @param shift.actual_to - the Date object representing of the actual end of the shift
 * @param shift.employment_id - the unique identifier of the shift's employment, defaults to `undefined`
 * @param shift.type - the type of shift, defaults to `"Normal"`
 * @param shift.overrun_type - the type of overrun, defaults to `"OT"`
 * @param shift.break_override - the duration of the shift's break in ms to override the default of 30mins every 6hrs, defaults to `null`
 * @param shift.weekly_hours - the weekly hours contracted in ms
 * @param shifts - an array of shifts, used to calculate cumulative additional hours for crossing the 37.5hrs/wk threshold
 *
 * @returns AdditionalHours
 * @returns 0 for all fields if invalid Dates are passed
 */
export const calculateAdditionalHours = (
    {
        id,
        from,
        planned_to,
        actual_to,
        employment_id,
        type,
        overrun_type,
        weekly_hours,
        break_override = null,
    }: AdditionHoursParams,
    shifts: Section2Shift[]
) => {
    const additionalHoursBreakdown: AdditionalHours = {
        flat: 0,
        time_and_half: 0,
        double: 0,
        toil: 0,
        absent_hours: 0,
    };

    if (!(actual_to >= planned_to && planned_to >= from)) {
        //times are out of sequence - return 0 for everything
        return additionalHoursBreakdown;
    }

    if (type && from && actual_to && planned_to) {
        const isAdditionalHoursShift = additionalHoursShiftTypes.includes(type);

        const fromObj = new Date(from);
        const plannedToObj = new Date(planned_to);
        const actualToObj = new Date(actual_to);

        const fromIsBankHoliday = isBankHoliday(fromObj);
        const toIsBankHoliday = isBankHoliday(actualToObj);

        const cumulativeAdditionalHours =
            type === "Bank"
                ? 0
                : calculateCumulativeAdditionalHours(
                      fromObj,
                      shifts,
                      id,
                      employment_id
                  );
        const plannedAdditionalHours = isAdditionalHoursShift
            ? calculateShiftHours(fromObj, planned_to, break_override)
            : 0;

        const overrunHours =
            plannedToObj === actualToObj
                ? 0
                : calculateShiftLength(plannedToObj, actualToObj);

        const paidAdditionalHours =
            plannedAdditionalHours + (overrun_type === "OT" ? overrunHours : 0);

        if (absentShiftTypes.includes(type)) {
            additionalHoursBreakdown.absent_hours = calculateShiftHours(
                fromObj,
                plannedToObj,
                break_override
            );
        } else if (paidAdditionalHours) {
            const weeklyOtThresholdHours = 1.35e8 - (weekly_hours ?? 1.35e8); //37.5hrs fallback but allowing for 0

            additionalHoursBreakdown.toil += Math.min(
                weeklyOtThresholdHours,
                calculateBankHolidayToil(
                    type,
                    fromObj,
                    overrun_type === "OT" ? actual_to : planned_to,
                    fromIsBankHoliday,
                    toIsBankHoliday
                )
            );

            if (type === "OT" || type === "Normal") {
                additionalHoursBreakdown.flat = Math.max(
                    0,
                    Math.min(
                        paidAdditionalHours,
                        weeklyOtThresholdHours - cumulativeAdditionalHours
                    )
                );
                if (
                    paidAdditionalHours + cumulativeAdditionalHours >=
                    weeklyOtThresholdHours
                ) {
                    if (fromIsBankHoliday || toIsBankHoliday) {
                        if (fromIsBankHoliday && toIsBankHoliday) {
                            additionalHoursBreakdown.double = Math.max(
                                0,
                                paidAdditionalHours -
                                    additionalHoursBreakdown.flat
                            );
                        } else if (fromIsBankHoliday) {
                            //from time until midnight
                            additionalHoursBreakdown.double =
                                calculateShiftLength(
                                    fromObj,
                                    (overrun_type === "OT"
                                        ? actualToObj
                                        : plannedToObj
                                    ).setHours(0, 0, 0, 0)
                                );
                        } else {
                            //midnight until to time
                            additionalHoursBreakdown.double =
                                calculateShiftLength(
                                    fromObj.setHours(24, 0, 0, 0),
                                    overrun_type === "OT"
                                        ? actualToObj
                                        : plannedToObj
                                );
                        }
                    }

                    additionalHoursBreakdown.time_and_half = Math.max(
                        0,
                        paidAdditionalHours -
                            additionalHoursBreakdown.double -
                            additionalHoursBreakdown.flat
                    );
                }
            } else if (type === "Bank") {
                additionalHoursBreakdown.flat = Math.floor(
                    paidAdditionalHours * 1.12004801920768
                );
            }

            if (type === "TOIL") {
                additionalHoursBreakdown.toil += plannedAdditionalHours;
            }
        } else if (type === "Normal") {
            additionalHoursBreakdown.toil += calculateBankHolidayToil(
                type,
                from,
                planned_to,
                fromIsBankHoliday,
                toIsBankHoliday
            );
        }

        if (
            ["Normal", ...additionalHoursShiftTypes].includes(type) &&
            overrun_type === "TOIL"
        ) {
            additionalHoursBreakdown.toil += overrunHours;
        }
    }

    return additionalHoursBreakdown;
};
