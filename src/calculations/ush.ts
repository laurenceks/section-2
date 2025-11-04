import {
    calculateBreak,
    calculateShiftHours,
    isBankHoliday,
} from "../utils/shiftLengths";
import {
    LeaveReliefUsh,
    Overrun,
    Section2Shift,
    ShiftType,
} from "../types/section2";
import { addDaysToTimestamp, formatDate } from "../utils/formatDates";
import { validateTimestampParameters } from "../utils/validateTimestamp";

const calculateRawLowerRate = (from: Date, to: Date) => {
    // returns in ms the total time within the lower rate windows
    if (!from || !to) {
        return 0;
    }
    const fromObj = new Date(from);
    const toObj = new Date(to);
    const fromTime = fromObj.getTime();
    const toTime = toObj.getTime();
    const fromDay = fromObj.getDay();
    const toDay = toObj.getDay();

    if (
        (fromDay === 0 && toDay === 0) ||
        (isBankHoliday(fromObj) && isBankHoliday(toObj)) ||
        (fromDay === 0 && isBankHoliday(toObj))
    ) {
        // only Sunday or BH
        return 0;
    }

    if (fromDay === 6 && toDay === 6) {
        //only Saturday
        return toTime - fromTime;
    }

    let lowerRateHours = 0;

    if ((fromDay === 6 && toDay === 0) || isBankHoliday(toObj)) {
        // Saturday into Sunday or into a bank holiday
        return toObj.setHours(0, 0, 0, 0) - fromTime;
    }

    if (
        (fromDay === 0 && toDay === 1) ||
        (isBankHoliday(fromObj) && !isBankHoliday(toObj) && toDay > 0)
    ) {
        // Sunday into Monday or BH into non BH
        return (
            Math.min(toTime, toObj.setHours(6, 0, 0, 0)) -
            Math.max(fromTime, toObj.setHours(0, 0, 0, 0))
        );
    }

    const from2000 = fromObj.setHours(20, 0, 0, 0);

    if (fromDay === 5 && toDay === 6) {
        // Friday into Saturday
        lowerRateHours = toTime - Math.max(from2000, fromTime);
    } else {
        const from0600 = fromObj.setHours(6, 0, 0, 0);

        if (fromTime < from0600) {
            // start before 0600
            lowerRateHours += Math.min(from0600, toTime) - fromTime;
        }

        const from2400 = fromObj.setHours(24, 0, 0, 0);

        if (
            (fromTime <= from2000 && toTime > from2000) ||
            fromTime > from2000
        ) {
            // from 2000 to midnight
            lowerRateHours +=
                Math.min(toTime, from2400) - Math.max(from2000, fromTime);
        }

        if (toTime > from2400) {
            // from midnight to 0600
            lowerRateHours +=
                Math.min(toTime, toObj.setHours(6, 0, 0, 0)) - from2400;
        }

        const to2000 = toObj.setHours(20, 0, 0, 0);

        if (toTime > to2000 && to2000 > from2400) {
            // end after 2000
            //TODO unreachable?
            lowerRateHours += toTime - Math.max(to2000, fromTime);
        }
    }

    return lowerRateHours;
};

const calculateRawHigherRate = (from: Date, to: Date) => {
    // calculate in ms the total time within the higher rate windows
    if (!from || !to) {
        return 0;
    }
    const fromObj = new Date(from);
    const toObj = new Date(to);
    const fromTime = fromObj.getTime();
    const toTime = toObj.getTime();
    const fromDay = fromObj.getDay();
    const toDay = toObj.getDay();

    if (
        fromDay !== 0 &&
        toDay !== 0 &&
        !isBankHoliday(fromObj) &&
        !isBankHoliday(toObj)
    ) {
        // neither Sunday nor BH
        return 0;
    }

    if (
        (fromDay === 0 && toDay === 0) ||
        (isBankHoliday(fromObj) && isBankHoliday(toObj)) ||
        (fromDay === 0 && isBankHoliday(toObj)) ||
        (isBankHoliday(fromObj) && toDay === 0)
    ) {
        // all Sunday or BH
        return toTime - fromTime;
    }

    const to0000 = toObj.setHours(0, 0, 0, 0);

    if (fromDay === 6 || (!isBankHoliday(fromObj) && isBankHoliday(toObj))) {
        // Saturday into Sunday or non-BH into BH
        return toTime - to0000;
    }
    if (fromDay === 0 || (isBankHoliday(fromObj) && !isBankHoliday(toObj))) {
        // Sunday into Monday or BH into non-BH
        return to0000 - fromTime;
    }

    return 0;
};

const calculateAverageUshForRelief = (
    from: Date,
    plannedTo: Date,
    weeks: number,
    log: Section2Shift[],
    employmentId?: number | string
) => {
    const averagePeriodStart = formatDate(
        addDaysToTimestamp(from, weeks * -7),
        "yyyy-mm-dd"
    );
    const fromSortingString = formatDate(from, "yyyy-mm-dd");
    const totalUsh = { lower: 0, higher: 0, hours: 0 };
    for (const shift of log) {
        if (
            shift.date < averagePeriodStart ||
            shift.employment_id !== employmentId ||
            shift.type === "AL (relief)" ||
            shift.type === "Absent (TOIL relief)" ||
            shift.type === "TOIL" ||
            shift.type === "Sick"
        ) {
            continue;
        }
        if (shift.date >= fromSortingString) {
            break;
        }
        totalUsh.lower = totalUsh.lower + shift.lower_rate;
        totalUsh.higher = totalUsh.higher + shift.higher_rate;

        //only count hours when USH was possible (i.e. under 37.5/wk threshold)
        totalUsh.hours =
            totalUsh.hours +
            Math.max(
                0,
                shift.actual_hours -
                    shift.time_and_half -
                    shift.double -
                    (shift.overrun_type === "TOIL"
                        ? shift.overrun_hours || 0
                        : 0)
            );
    }
    const shiftHours = calculateShiftHours(from, plannedTo);

    return {
        plannedLowerRaw:
            totalUsh.hours === 0
                ? 0
                : Math.round((totalUsh.lower / totalUsh.hours) * shiftHours),
        plannedHigherRaw:
            totalUsh.hours === 0
                ? 0
                : Math.round((totalUsh.higher / totalUsh.hours) * shiftHours),
    };
};

const ushTypes: ShiftType[] = ["Normal", "OT", "AL", "Absent (TOIL)", "Bank"];

/**
 * Calculates USH object containing calculated unsocial hours in ms (adjusted for additional hours if hoursOverThreshold > 0)
 *
 * @param shift - shift parameters for calculating
 * @param shift.from - the Date object representing of the start of the shift
 * @param shift.planned_to - the Date object representing of the planned end of the shift
 * @param shift.type - the type of shift, defaults to `"Normal"`
 * @param shift.actual_to - the Date object representing of the actual end of the shift, defaults to `null`
 * @param shift.overrun_type - the type of overrun, defaults to `"OT"`
 * @param shift.employment_id - the unique identifier of the shift's employment, defaults to `undefined`
 * @param shift.break_override - the duration of the shift's break in ms to override the default of 30mins every 6hrs, defaults to `null`
 * @param shift.shifts - an array of shifts, used to calculate different rate thresholds and unsocial averages, defaults to `[]`
 * @param shift.hours_over_threshold - number of milliseconds over the 37.5hrs threshold **including this shift**
 * @param shift.half_is_all_ush - if set to `true` shifts that are exactly half unsocial will earn the whole of the shift as unsocial (e.g. a normal Monday 1600-0000 = 7.5hrs lower rate), if `false` only shifts that are **more** than half unsocial will (e.g. a normal Monday 1600-0000 = 4hrs lower rate), defaults to `true`
 * @param shift.break_from_higher - if set to `true` breaks will first be deducted from higher rate earnings, if `false` from lower rate first, defaults to `true`
 * @param shift.leave_relief_ush_type - specifies the way unsocial hours are calculated when a shift is leave or TOIL on unplanned relief, defaults to `"best"`
 *
 * @returns USH
 */

export const calculateUsh = ({
    from,
    planned_to,
    type = "Normal",
    hours_over_threshold = 0,
    break_override = null,
    shifts = [],
    half_is_all_ush = false,
    break_from_higher = true,
    overrun_type = "OT",
    actual_to = null,
    leave_relief_ush_type = "best",
    employment_id,
}: {
    from: Date;
    planned_to: Date;
    type?: ShiftType;
    hours_over_threshold?: number;
    break_override?: number | null;
    shifts?: Section2Shift[];
    half_is_all_ush?: boolean;
    break_from_higher?: boolean;
    overrun_type?: Overrun;
    actual_to?: Date | null;
    leave_relief_ush_type?: LeaveReliefUsh;
    employment_id?: string | number;
}) => {
    if (!validateTimestampParameters(from, planned_to, actual_to)) {
        //times are either invalid or out of sequence - return 0 for everything
        return { lower_rate: 0, higher_rate: 0 };
    }

    let plannedLowerRaw = 0;
    let plannedHigherRaw = 0;
    let overrunLower = 0;
    let overrunHigher = 0;
    if (
        from &&
        planned_to &&
        (ushTypes.includes(type) || (type === "TOIL" && overrun_type == "OT"))
    ) {
        const fromObj = new Date(from);
        const plannedToObj = new Date(planned_to);
        const actualToObj = actual_to ? new Date(actual_to) : null;

        if (ushTypes.includes(type)) {
            plannedLowerRaw = calculateRawLowerRate(fromObj, plannedToObj);
            plannedHigherRaw = calculateRawHigherRate(fromObj, plannedToObj);
        }

        const totalPlannedUshRaw = plannedLowerRaw + plannedHigherRaw;

        const paidOverrunLength =
            actualToObj && overrun_type === "OT"
                ? actualToObj.getTime() - plannedToObj.getTime()
                : 0;

        if (paidOverrunLength && actualToObj && overrun_type === "OT") {
            overrunLower = calculateRawLowerRate(plannedToObj, actualToObj);
            overrunHigher = calculateRawHigherRate(plannedToObj, actualToObj);
        }

        let plannedLength = plannedToObj.getTime() - fromObj.getTime();
        const breakLength = calculateBreak(plannedLength, break_override);

        if (hours_over_threshold) {
            //recalculate USH based on new end including break
            if (type === "OT") {
                plannedToObj.setTime(
                    Math.min(
                        plannedToObj.getTime(),
                        Math.max(
                            fromObj.getTime(),
                            plannedToObj.getTime() +
                                paidOverrunLength -
                                hours_over_threshold
                        )
                    )
                );
                plannedLowerRaw = calculateRawLowerRate(fromObj, plannedToObj);
                plannedHigherRaw = calculateRawHigherRate(
                    fromObj,
                    plannedToObj
                );
            }
            if ((overrunLower || overrunHigher) && actualToObj) {
                const originalPlannedTo = new Date(planned_to);
                actualToObj.setTime(
                    Math.max(
                        actualToObj.getTime() - hours_over_threshold,
                        originalPlannedTo.getTime()
                    )
                );
                overrunLower = calculateRawLowerRate(
                    originalPlannedTo,
                    actualToObj
                );
                overrunHigher = calculateRawHigherRate(
                    originalPlannedTo,
                    actualToObj
                );
            }
        }
        if (
            totalPlannedUshRaw > plannedLength / 2 ||
            (half_is_all_ush && totalPlannedUshRaw >= plannedLength / 2)
        ) {
            // more than half the shift is USH
            if (!plannedHigherRaw) {
                // only lower rate
                plannedLowerRaw = Math.max(
                    0,
                    plannedLength -
                        breakLength -
                        Math.max(hours_over_threshold - paidOverrunLength, 0)
                );
            } else if (!plannedLowerRaw) {
                // only higher rate
                plannedHigherRaw = Math.max(
                    0,
                    plannedLength -
                        breakLength -
                        Math.max(hours_over_threshold - paidOverrunLength, 0)
                );
            } else {
                if (hours_over_threshold - paidOverrunLength > 0) {
                    // update shift length to match USH length with OT hours deducted
                    plannedLength = plannedToObj.getTime() - fromObj.getTime();
                }
                if (break_from_higher) {
                    // take break from more expensive side
                    const higherBreak = Math.min(plannedHigherRaw, breakLength);

                    const plannedHigherNoBreak = plannedHigherRaw;

                    //higher rate can never be increased beyond its raw value
                    plannedHigherRaw = Math.min(
                        plannedHigherRaw - higherBreak,
                        plannedLength - plannedLowerRaw - higherBreak
                    );

                    plannedLowerRaw =
                        plannedLength -
                        plannedHigherNoBreak -
                        (breakLength - higherBreak);
                } else {
                    // take break from less expensive side
                    const lowerBreak = Math.min(plannedLowerRaw, breakLength);
                    const plannedLowerNoBreak = plannedLowerRaw;

                    plannedLowerRaw = Math.min(
                        plannedLowerRaw - lowerBreak,
                        plannedLength - plannedHigherRaw - lowerBreak
                    );

                    plannedHigherRaw =
                        plannedLength -
                        plannedLowerNoBreak -
                        (breakLength - lowerBreak);
                }
            }
        }
    } else if (type === "AL (relief)" || type === "Absent (TOIL relief)") {
        switch (leave_relief_ush_type) {
            case "best":
                {
                    const {
                        plannedLowerRaw: lower13,
                        plannedHigherRaw: higher13,
                    } = calculateAverageUshForRelief(
                        from,
                        planned_to,
                        13,
                        shifts,
                        employment_id
                    );
                    const {
                        plannedLowerRaw: lower52,
                        plannedHigherRaw: higher52,
                    } = calculateAverageUshForRelief(
                        from,
                        planned_to,
                        52,
                        shifts,
                        employment_id
                    );
                    //TODO weight for higher?
                    if (lower13 + higher13 > lower52 + higher52) {
                        plannedLowerRaw = lower13;
                        plannedHigherRaw = higher13;
                    } else {
                        plannedLowerRaw = lower52;
                        plannedHigherRaw = higher52;
                    }
                }
                break;
            case "average13":
                {
                    ({ plannedLowerRaw, plannedHigherRaw } =
                        calculateAverageUshForRelief(
                            from,
                            planned_to,
                            13,
                            shifts,
                            employment_id
                        ));
                }
                break;
            case "average52":
                {
                    ({ plannedLowerRaw, plannedHigherRaw } =
                        calculateAverageUshForRelief(
                            from,
                            planned_to,
                            52,
                            shifts,
                            employment_id
                        ));
                }
                break;
            case "flat":
                {
                    if (from.getDay()) {
                        plannedLowerRaw = 7200000; // 2hrs;
                    } else {
                        plannedHigherRaw = 7200000; // 2hrs (Sun);
                    }
                }
                break;
        }
    }

    return {
        lower_rate: Math.max(0, plannedLowerRaw + overrunLower),
        higher_rate: Math.max(0, plannedHigherRaw + overrunHigher),
    };
};
