import { makeToAlwaysLater } from "../utils/conversions";
import {
    AdditionalHours,
    AdditionalHoursParams,
    Overrun,
    Section2Shift,
    ShiftType,
} from "../types/section2";
import {
    absentShiftTypes,
    additionalHoursShiftTypes,
} from "../utils/shiftTypes";
import {
    calculateBreak,
    calculateShiftHours,
    calculateShiftLength,
    isBankHoliday,
} from "../utils/shiftLengths";
import { validateTimestampParameters } from "../utils/validateTimestamp";

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

const calculateRawBankHoliday = (from: Date, to: Date) => {
    // calculate in ms the total time within the bank holiday windows
    if (!from || !to) {
        return 0;
    }
    const fromObj = new Date(from);
    const toObj = new Date(to);
    const fromTime = fromObj.getTime();
    const toTime = toObj.getTime();

    if (!isBankHoliday(fromObj) && !isBankHoliday(toObj)) {
        // neither BH
        return 0;
    }

    if (isBankHoliday(fromObj) && isBankHoliday(toObj)) {
        // all BH
        return toTime - fromTime;
    }

    const to0000 = toObj.setHours(0, 0, 0, 0);

    if (!isBankHoliday(fromObj) && isBankHoliday(toObj)) {
        // non-BH into BH
        return toTime - to0000;
    }
    if (isBankHoliday(fromObj) && !isBankHoliday(toObj)) {
        // BH into non-BH
        return to0000 - fromTime;
    }

    return 0;
};

const calculateBankHolidayHours = (
    from: Date,
    planned_to: Date,
    actual_to: Date,
    fromIsBankHoliday: boolean,
    toIsBankHoliday: boolean,
    break_override: number | null = null,
    type: ShiftType = "OT",
    overrun_type: Overrun = "OT",
    hoursUntilThresholdMs: number = 0,
    break_from_higher: boolean = true
) => {
    let plannedDouble = 0;
    // plannedToil is used to calculate proportions for where breaks should be deducted, but only planned shifts attract it
    let plannedToil = 0;
    let overrunDouble = 0;
    if (
        (type === "Normal" ||
            type === "OT" ||
            (type === "TOIL" && overrun_type === "OT")) &&
        (fromIsBankHoliday || toIsBankHoliday)
    ) {
        const fromObj = new Date(from);
        const plannedToObj = new Date(planned_to);
        const actualToObj = new Date(actual_to);
        const plannedLength = plannedToObj.getTime() - fromObj.getTime();
        const breakLength = calculateBreak(plannedLength, break_override);
        const flatTo = new Date(
            Math.min(
                actualToObj.getTime(),
                (type === "Normal" || type === "TOIL"
                    ? plannedToObj.getTime()
                    : fromObj.getTime()) +
                    hoursUntilThresholdMs +
                    (type === "TOIL" ? 0 : breakLength)
            )
        );

        //planned hours
        if (
            type === "Normal" ||
            hoursUntilThresholdMs >= plannedLength - breakLength
        ) {
            //normal shift - just add earned TOIL
            plannedToil += calculateRawBankHoliday(fromObj, plannedToObj);
        } else if (type === "OT" && hoursUntilThresholdMs <= 0) {
            //shift is all OT hours - just add earned double
            plannedDouble += calculateRawBankHoliday(fromObj, plannedToObj);
        } else {
            if (flatTo > fromObj) {
                //mixed flat and OT shift - add TOIL for flat hours before threshold (including break)
                plannedToil += Math.max(
                    0,
                    calculateRawBankHoliday(
                        fromObj,
                        new Date(
                            Math.min(plannedToObj.getTime(), flatTo.getTime())
                        )
                    )
                );
            }
            if (flatTo < plannedToObj) {
                //add any planned hours over threshold to double if still in BH window (excluding break)
                plannedDouble += calculateRawBankHoliday(flatTo, plannedToObj);
            }
        }

        //breaks
        if (breakLength) {
            if (
                type === "Normal" ||
                hoursUntilThresholdMs >= plannedLength - breakLength
            ) {
                if (break_from_higher || plannedLength === plannedToil) {
                    //shift is all toil, or break comes from higher rate first which aligns with toil
                    plannedToil -= Math.min(
                        breakLength,
                        Math.max(0, plannedToil - breakLength)
                    );
                }
            } else if (hoursUntilThresholdMs <= 0) {
                //shift is all OT hours
                if (plannedDouble >= plannedLength) {
                    //shift is all double
                    plannedDouble -= Math.min(
                        breakLength,
                        Math.max(0, plannedDouble - breakLength)
                    );
                } else {
                    const timeAndHalf = Math.max(
                        0,
                        plannedLength - hoursUntilThresholdMs - plannedDouble
                    );

                    let doubleBreak = 0;
                    if (break_from_higher) {
                        doubleBreak = Math.min(breakLength, plannedDouble);
                    } else {
                        // take break from less expensive side first (time_and_half is calculated elsewhere)
                        const timeAndHalfBreak = Math.min(
                            timeAndHalf,
                            breakLength
                        );
                        doubleBreak = Math.max(
                            0,
                            breakLength - timeAndHalfBreak
                        );
                    }
                    plannedDouble = Math.max(0, plannedDouble - doubleBreak);
                }
            } else {
                //shift is a mix of TOIL and OT
                //calculate break in TOIL section
                const nonBhBreak = Math.min(
                    breakLength,
                    Math.max(0, plannedLength - plannedToil - plannedDouble)
                );
                const toilBreak = break_from_higher
                    ? Math.min(breakLength, plannedToil)
                    : Math.min(
                          Math.max(0, breakLength - nonBhBreak),
                          plannedToil
                      );

                plannedToil -= toilBreak;

                if (toilBreak < breakLength) {
                    const timeAndHalf = Math.max(
                        0,
                        plannedLength - hoursUntilThresholdMs - plannedDouble
                    );

                    let doubleBreak = 0;
                    if (break_from_higher) {
                        doubleBreak = Math.min(breakLength, plannedDouble);
                    } else {
                        // take break from less expensive side first (time_and_half is calculated elsewhere)
                        const timeAndHalfBreak = Math.min(
                            timeAndHalf,
                            breakLength
                        );
                        doubleBreak = Math.max(
                            0,
                            breakLength - timeAndHalfBreak
                        );
                    }
                    plannedDouble -= doubleBreak;
                }
            }
        }

        //overrun hours
        if (overrun_type === "OT" && actualToObj > plannedToObj) {
            const otFrom =
                type === "Normal"
                    ? new Date(
                          Math.min(
                              plannedToObj.getTime() + hoursUntilThresholdMs,
                              actualToObj.getTime()
                          )
                      )
                    : flatTo;
            if (otFrom < actualToObj) {
                //add OT double
                overrunDouble = calculateRawBankHoliday(
                    otFrom < plannedToObj ? plannedToObj : otFrom,
                    actualToObj
                );
            }
        }
    }

    return {
        // only normal shifts can earn toil
        toil: type === "Normal" ? plannedToil : 0,
        double: plannedDouble + overrunDouble,
    };
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
        break_from_higher = true,
    }: AdditionalHoursParams,
    shifts: Section2Shift[]
) => {
    const additionalHoursBreakdown: AdditionalHours = {
        flat: 0,
        time_and_half: 0,
        double: 0,
        toil: 0,
        absent_hours: 0,
    };

    if (!validateTimestampParameters(from, planned_to, actual_to)) {
        //times are either invalid or out of sequence - return 0 for everything
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

        let paidAdditionalHours =
            plannedAdditionalHours + (overrun_type === "OT" ? overrunHours : 0);

        if (absentShiftTypes.includes(type)) {
            additionalHoursBreakdown.absent_hours = calculateShiftHours(
                fromObj,
                plannedToObj,
                break_override
            );
        } else if (paidAdditionalHours) {
            const weeklyOtThresholdHours = 1.35e8 - (weekly_hours ?? 1.35e8); //37.5hrs fallback but allowing for 0

            const { toil: bhToil, double: bhDouble } =
                calculateBankHolidayHours(
                    new Date(from),
                    new Date(planned_to),
                    new Date(actual_to),
                    fromIsBankHoliday,
                    toIsBankHoliday,
                    break_override,
                    type,
                    overrun_type,
                    Math.max(
                        0,
                        weeklyOtThresholdHours - cumulativeAdditionalHours
                    ),
                    break_from_higher
                );

            additionalHoursBreakdown.toil += bhToil;

            if (type === "Normal" || type === "OT" || type === "TOIL") {
                if (type === "TOIL") {
                    additionalHoursBreakdown.toil += plannedAdditionalHours;
                    paidAdditionalHours = Math.max(
                        0,
                        paidAdditionalHours - plannedAdditionalHours
                    );
                }

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
                        if (type === "OT" || overrun_type === "OT") {
                            additionalHoursBreakdown.double += bhDouble;
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
        } else if (type === "Normal") {
            additionalHoursBreakdown.toil += calculateBankHolidayHours(
                new Date(from),
                new Date(planned_to),
                new Date(actual_to),
                fromIsBankHoliday,
                toIsBankHoliday,
                break_override,
                type,
                overrun_type,
                Math.max(
                    0,
                    1.35e8 -
                        (weekly_hours ?? 1.35e8) -
                        cumulativeAdditionalHours
                ),
                break_from_higher
            ).toil;
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
