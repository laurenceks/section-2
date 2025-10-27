# section-2
A library for calculating unsocial hours entitlements under the NHS agenda for change's section 2.

## Features

- Dependency free
- Lightweight (~32.1kb)
- Fully typed
- Extensively tested
- ESM and CJS versions
- 
## Installation

Install with npm

```bash
  npm install section-2
```

## Usage

section-2 provides one main function and two auxiliary functions.

### `calculateSection2`

This is the library's main function. It accepts a parameters object and options object.

```typescript
calculateSection2(Section2Params, Section2Options) => Section2;  
```

It returns an object with calculated durations *in ms*.

```typescript
interface Section2 {
    //Total time absent
    absent_hours: number;
    //Total time paid at double rate
    double: number;
    //Total time paid at normal rate
    flat: number;
    //Total time paid at time and a half rate
    time_and_half: number;
    //Total TOIL
    toil: number;
    //Total time paid at higher rate
    higher_rate: number;
    //Total time paid at lower rate
    lower_rate: number;
}
```

#### Why ms?

- integrates directly with databases that use integers to store durations (like the project this library originated from)
- avoids floating point errors
- allows flexibility for using the durations as calculations or display values

#### `Section2Params`

These are the parameters used by the function to calculate the result:

```typescript
interface Section2Params {
    // The datetime of the start of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format)
    from: Date | string | number;
    // The datetime of the planned end of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format)
    planned_to: Date | string | number;
    // The datetime of the actual end of the shift (must be a valid date, unix time or string in YYYY-MM-DD hh:mm:ss or ISO format)
    actual_to?: Date | string | number;
    // The type of shift
    type?: ShiftType;
    // The type of overrun
    overrun_type?: Overrun;
    // The unique identifier of the shift */
    id?: string | number;
    // The unique identifier of the shift's employment (group)
    employment_id?: string | number;
    // The duration of the shift's break **in ms** to override the default of 30mins every 6hrs
    break_override?: number | null;
    // An array of shifts, used to calculate different rate thresholds and unsocial averages
    shifts?: Section2Shift[];
}
```

Of these only `from` and `planned_to` are required:

```typescript
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
}
```

#### `Section2Options`

These are options that change how the function calculates results:

```typescript
interface Section2Options {
    //The weekly hours contracted **in ms**
    weekly_hours?: number;
    // If set to `true` shifts that are exactly half unsocial will earn the whole of the shift as unsocial (e.g. a normal Monday 1600-0000 = 7.5hrs lower rate), if `false` only shifts that are **more** than half unsocial will (e.g. a normal Monday 1600-0000 = 4hrs lower rate)
    half_is_all_ush?: boolean;
    // If set to `true` breaks will first be deducted from higher rate earnings, if `false` from lower rate first
    break_from_higher?: boolean;
    // Specifies the way unsocial hours are calculated when a shift is leave or TOIL on unplanned relief
    leave_relief_ush_type?: LeaveReliefUsh;
}
```

They are all optional:

```typescript
{
    weekly_hours = 135000000, // 37.5hrs (full time)
    half_is_all_ush = false,
    break_from_higher = true,
    leave_relief_ush_type = "best",
}
```

### Auxiliary functions

There are two further functions provided by the library; `calculateAdditionalHours` and `calculateUsh`. They are both used by `calculateSection2`. Their input parameters are more rigid than the main function.

#### `calculateAdditionalHours`

Calculates additional hours (hours worked in addition to contracted hours) accrued in a shift, plus absent hours.

```typescript
calculateAdditionalHours = (
    AdditionalHoursParams,
    shifts: Section2Shift[]
) => AdditionalHours
```

It returns an object of durations **in ms**.

```typescript
export interface AdditionalHours {
    // Total time absent
    absent_hours: number;
    // Total time paid at double rate
    double: number;
    // Total time paid at normal rate
    flat: number;
    // Total time paid at time and a half rate
    time_and_half: number;
    // Total TOIL
    toil: number;
}
```

##### AdditionalHoursParams

Parameters for calculating additional hours:

```typescript
export interface AdditionalHoursParams {
    // The unique identifier of the shift
    id?: string | number;
    // The datetime of the start of the shift
    from: Date;
    // The datetime of the planned end of the shift
    planned_to: Date;
    // The datetime of the actual end of the shift
    actual_to: Date;
    // The unique identifier of the shift's employment (group)
    employment_id?: string | number;
    // The type of shift
    type: ShiftType;
    // The type of overrun
    overrun_type: Overrun;
    // Weekly contracted hours **in ms**
    weekly_hours: number;
    // The duration of the shift's break **in ms** to override the default of 30mins every 6hrs
    break_override?: number | null;
    // If set to `true` breaks will first be deducted from higher/double rate earnings, if `false` from lower/time and half rate first (at flat rates first, then OT rates) 
    break_from_higher?: boolean;
}
```

Of these, two are optional:

```typescript
    break_override = null,
    break_from_higher = true,
```

##### shifts

The second argument is optional and represents an array of shifts used to calculate cumulative hours (important for part-time staff):

`shifts: Section2Shift[]`

#### `calculateUsh`

Calculates lower and higher USH hours:

```typescript
const calculateUsh = ({
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
    } : {
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
}) => USH
```
Returns a simple USH object of durations **in ms**:

```typescript
interface Ush {
    // Total time paid at higher rate
    higher_rate: number;
    // Total time paid at lower rate
    lower_rate: number;
}
```

## Further documentation

For more detailed documentation please refer to the type annotations in the library.

## Issues

This library is new and despite being thoroughly tested may contain inaccuracies. The complex nature of Agenda for Change and in particular Section 2 means that there are many variations between trusts in how they interpret and implement the rules.

If you find the library is not calculating something as expected, please create an issue with enough detail for replicating the problem.

## Related

This library is implemented in the NHS Pay Log, a web app for calculating pay on Agenda for Change contracts. 

[NHS Pay Log](https://pay.laurencesummers.com)

## License

This project is licensed under the **GNU Affero General Public Licence v3.0** (AGPL-3.0-or-later). See the [LICENCE](LICENCE) file for details.

### Commercial License

For commercial or closed-source use where AGPL compliance is not desirable, a commercial licence can be purchased. Please contact [github.com/laurenceks](https://github.com/laurenceks) for licensing information.
