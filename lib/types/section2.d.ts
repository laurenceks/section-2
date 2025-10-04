/**
 * The two types of payment for overruns (when actual_to > planned_to):
 * - OT - OverTime; calculates section 2 **and** additional hours
 * - TOIL - Time Off In Lieu; calculates TOIL but no section 2 hours
 */
export type Overrun = "OT" | "TOIL";

/**
 * The type of shift; this setting dictates how section 2 and additional hours are calculated
 * - Normal - a planned shift; calculates section 2 hours
 * - OT - OverTime; calculates section 2 **and** additional hours
 * - TOIL - Time Off In Lieu; calculates no section 2 hours
 * - AL - Annual Leave on a planned shift; calculates section 2 hours
 * - AL (relief) - Annual Leave on unplanned relief; calculates section 2 hours
 * - Absent (TOIL) - TOIL on a planned shift; calculates section 2 hours
 * - Absent (TOIL relief) - TOIL on unplanned relief; calculates section 2 hours
 * - Sick - Sickness; calculates no section 2 hours
 * - Bank - a shift undertaken as a bank/casual worked; calculates section 2 **and** additional hours **with** holiday pay (approximately 12%)
 */

export type ShiftType =
    | "Normal"
    | "AL"
    | "AL (relief)"
    | "Absent (TOIL)"
    | "Absent (TOIL relief)"
    | "Sick"
    | "Bank"
    | Overrun;

/**
 * The returned object of calculated additional hours durations in ms; additional hours are any hours which are worked in addition to planned shifts (including overruns)
 */

export interface AdditionalHours {
    /** Total time absent (ms) */
    absent_hours: number;
    /** Total time paid at double rate (ms) */
    double: number;
    /** Total time paid at normal rate (ms) */
    flat: number;
    /** Total time paid at time and a half rate (ms) */
    time_and_half: number;
    /** Total TOIL (ms) */
    toil: number;
}

/**
 * The returned object of calculated section 2 hours; the total unsocial hours awarded **without additional hours accounted for**
 */

export interface Ush {
    /** Total time paid at higher rate (ms) */
    higher_rate: number;
    /** Total time paid at lower rate (ms) */
    lower_rate: number;
}

/**
 * The returned object of calculated durations in ms; additional hours with the lower and higher rates for unsocial hours, adjusted to account for the additional hours (i.e. section 2 hours cannot be earned on time and half or double rates)
 */

export interface Section2 extends AdditionalHours, Ush {}

/**
 * The object representing a shift required to calculate additional hours
 */

export interface AdditionHoursParams {
    /** The unique identifier of the shift */
    id?: string | number;
    /** The datetime of the start of the shift */
    from: Date;
    /** The datetime of the planned end of the shift */
    planned_to: Date;
    /** The datetime of the actual end of the shift */
    actual_to: Date;
    /** The unique identifier of the shift's employment (group) */
    employment_id?: string | number;
    /** The type of shift */
    type: ShiftType;
    /** The type of overrun */
    overrun_type: Overrun;
    /** Weekly contracted hours **in ms** */
    weekly_hours: number;
    /** The duration of the shift's break **in ms** to override the default of 30mins every 6hrs */
    break_override?: number | null;
}

/**
 * The object representing the options for calculating section 2 and additional hours
 */

export interface Section2Options {
    /** The weekly hours contracted **in ms** */
    weekly_hours?: number;
    /** If set to `true` shifts that are exactly half unsocial will earn the whole of the shift as unsocial (e.g. a normal Monday 1600-0000 = 7.5hrs lower rate), if `false` only shifts that are **more** than half unsocial will (e.g. a normal Monday 1600-0000 = 4hrs lower rate) */
    half_is_all_ush?: boolean;
    /** If set to `true` breaks will first be deducted from higher rate earnings, if `false` from lower rate first */
    break_from_higher?: boolean;
    /** Specifies the way unsocial hours are calculated when a shift is leave or TOIL on unplanned relief*/
    leave_relief_ush_type?: LeaveReliefUsh;
}

export interface UshParams
    extends Omit<Section2Options, "weekly_hours">,
        Omit<AdditionHoursParams, "type" | "actual_to" | "overrun_type">,
        Partial<
            Pick<AdditionHoursParams, "type" | "actual_to" | "overrun_type">
        > {
    /** An array of shifts, used to calculate different rate thresholds and unsocial averages */
    shifts?: Section2Shift[];
}

export interface Section2Params {
    /** The datetime of the start of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    from: Date | string | number;
    /** The datetime of the planned end of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    planned_to: Date | string | number;
    /** The datetime of the actual end of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    actual_to?: Date | string | number;
    /** The type of shift */
    type?: ShiftType;
    /** The type of overrun */
    overrun_type?: Overrun;
    /** The unique identifier of the shift */
    id?: string | number;
    /** The unique identifier of the shift's employment (group) */
    employment_id?: string | number;
    /** The duration of the shift's break **in ms** to override the default of 30mins every 6hrs */
    break_override?: number | null;
    /** An array of shifts, used to calculate different rate thresholds and unsocial averages */
    shifts?: Section2Shift[];
}
/**
 * The object required to calculate section 2 and additional hours representing a shift
 */

export interface Section2Shift
    extends Section2Params,
        Section2,
        Section2Options {
    /** The actual time the shift ended (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    actual_to: string;
    /** The total duration of the shift (actual_to - from) */
    actual_hours: number; //ms
    /** A duration in ms used to overwrite the default break of 30mins every 6hrs */
    break_override?: number | null;
    /** The date of the shift in YYYY-MM-DD format */
    date: string;
    employment_id?: string | number;
    /** The time the shift began (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    from: string;
    /** A unique identifier used to exclude the given shift when averaging all shift values */
    id?: string | number;
    /** The duration of the shift's overrun (actual_to - planned_to) */
    overrun_hours?: number; //ms
    /** The type of overrun (when a shift finishes later than planned) */
    overrun_type?: Overrun;
    /** The time the shift was planned to end (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format) */
    planned_to: string;
    /** The type of shift */
    type: ShiftType;
}

/**
 * The method used when calculating section 2 hours for leave/toil during unplanned relief periods
 * - best - the greatest of average13 and average52
 * - average13 - the average of the last 13 weeks of section 2 hours
 * - average52 - the average of the last 52 weeks of section 2 hours
 * - flat - a flat 2 hours (in ms) for each shift
 * - none - no section 2 hours
 */

export type LeaveReliefUsh =
    | "best"
    | "average13"
    | "average52"
    | "flat"
    | "none";
