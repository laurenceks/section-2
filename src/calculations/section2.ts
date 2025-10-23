import { validateTimestamp } from "../utils/validateTimestamp";
import { makeToAlwaysLater } from "../utils/conversions";
import { calculateAdditionalHours } from "./additionalHours";
import { calculateUsh } from "./ush";
import {
    LeaveReliefUsh,
    Overrun,
    Section2,
    Section2Params,
    ShiftType,
} from "../types/section2";

/**
 * Calculates Section2 object containing additional and unsocial hours in ms
 *
 * *Param names are in snake_case to maximise database compatibility*
 *
 * *Any param or returned value representing a duration is in ms to preserve accuracy and for database compatibility*

 * - Will return `0` for all values if invalid datetimes are passed
 * - Will force `actual_to` to be later or equal to `planned_to`, and `planned_to` to be later than `from`
 *
 * @param shift - shift parameters for calculating
 * @param shift.from - the datetime of the start of the shift
 * @param shift.planned_to - the datetime of the planned end of the shift
 * @param shift.actual_to - the datetime of the actual end of the shift, optional, falls back to `planned_to`
 * @param shift.type - the type of shift, defaults to `"Normal"`
 * @param shift.overrun_type - the type of overrun, defaults to `"OT"`
 * @param shift.id - the unique identifier of the shift, defaults to `undefined`
 * @param shift.employment_id - the unique identifier of the shift's employment, defaults to `undefined`
 * @param shift.break_override - the duration of the shift's break **in ms** to override the default of 30mins every 6hrs, defaults to `null`
 * @param shift.shifts - an array of shifts, used to calculate different rate thresholds and unsocial averages, defaults to `[]`
 *
 * @param options - options for calculation methods
 * @param options.weekly_hours - the weekly hours contracted **in ms**, defaults to `135000000` (37.5hrs; full time)
 * @param options.half_is_all_ush - if set to `true` shifts that are exactly half unsocial will earn the whole of the shift as unsocial (e.g. a normal Monday 1600-0000 = 7.5hrs lower rate), if `false` only shifts that are **more** than half unsocial will (e.g. a normal Monday 1600-0000 = 4hrs lower rate), defaults to `true`
 * @param options.break_from_higher - if set to `true` breaks will first be deducted from higher rate earnings, if `false` from lower rate first, defaults to `true`
 * @param options.leave_relief_ush_type - specifies the way unsocial hours are calculated when a shift is leave or TOIL on unplanned relief, defaults to `"best"`
 *
 * @returns Section2
 */

export const calculateSection2 = (
    {
        from,
        planned_to,
        actual_to,
        type = "Normal",
        overrun_type = "OT",
        id = undefined,
        employment_id = undefined,
        break_override = null,
        shifts = [],
    }: Section2Params,
    {
        weekly_hours = 135000000,
        half_is_all_ush = false,
        break_from_higher = true,
        leave_relief_ush_type = "best",
    }: {
        weekly_hours?: number;
        half_is_all_ush?: boolean;
        break_from_higher?: boolean;
        leave_relief_ush_type?: LeaveReliefUsh;
    }
): Section2 => {
    if (
        !validateTimestamp(from) ||
        !validateTimestamp(planned_to) ||
        (!!actual_to && !validateTimestamp(actual_to))
    ) {
        console.warn(
            "Invalid datetime passed - function will return 0 for all fields. Datetimes must be a Date object, unix time or a string in yyyy-mm-dd or ISO format."
        );
        return {
            flat: 0,
            higher_rate: 0,
            time_and_half: 0,
            toil: 0,
            lower_rate: 0,
            double: 0,
            absent_hours: 0,
        };
    }
    const { fromObj, toObj: plannedToObj } = makeToAlwaysLater(
        from,
        planned_to
    );
    const actualToObj = actual_to
        ? makeToAlwaysLater(plannedToObj, actual_to).toObj
        : new Date(plannedToObj);

    const additionalHours = calculateAdditionalHours(
        {
            from: fromObj,
            planned_to: plannedToObj,
            actual_to: actualToObj,
            type: type as ShiftType,
            overrun_type: overrun_type as Overrun,
            id,
            employment_id,
            weekly_hours,
            break_override,
            break_from_higher,
        },
        shifts || []
    );

    const ush = calculateUsh({
        from: fromObj,
        planned_to: plannedToObj,
        type,
        hours_over_threshold:
            additionalHours.time_and_half + additionalHours.double,
        break_override,
        shifts,
        half_is_all_ush,
        break_from_higher,
        overrun_type,
        actual_to: actualToObj,
        leave_relief_ush_type,
        employment_id,
    });
    return { ...additionalHours, ...ush };
};
