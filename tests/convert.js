// save as mapShiftsNoDeps.js
import { execSync } from "child_process";

const raw = [
    {
        id: 675,
        employment_id: 82,
        date: "2024-03-18",
        from: "2024-03-18T09:15:00.000Z",
        planned_to: "2024-03-18T17:15:00.000Z",
        actual_to: "2024-03-18T17:15:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 677,
        employment_id: 82,
        date: "2024-03-19",
        from: "2024-03-19T08:30:00.000Z",
        planned_to: "2024-03-19T12:30:00.000Z",
        actual_to: "2024-03-19T12:30:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 16128691,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 14400000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 679,
        employment_id: 82,
        date: "2024-03-21",
        from: "2024-03-21T08:30:00.000Z",
        planned_to: "2024-03-21T16:30:00.000Z",
        actual_to: "2024-03-21T16:30:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 715,
        employment_id: 82,
        date: "2024-06-17",
        from: "2024-06-17T08:00:00.000Z",
        planned_to: "2024-06-17T16:00:00.000Z",
        actual_to: "2024-06-17T16:00:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 716,
        employment_id: 82,
        date: "2024-06-19",
        from: "2024-06-19T07:00:00.000Z",
        planned_to: "2024-06-19T15:00:00.000Z",
        actual_to: "2024-06-19T15:00:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 723,
        employment_id: 82,
        date: "2024-07-09",
        from: "2024-07-09T08:00:00.000Z",
        planned_to: "2024-07-09T16:00:00.000Z",
        actual_to: "2024-07-09T16:00:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
    {
        id: 733,
        employment_id: 82,
        date: "2024-08-02",
        from: "2024-08-02T07:00:00.000Z",
        planned_to: "2024-08-02T15:00:00.000Z",
        actual_to: "2024-08-02T15:00:00.000Z",
        type: "Bank",
        overrun_type: "TOIL",
        absent_hours: 0,
        double: 0,
        flat: 30241296,
        time_and_half: 0,
        toil: 0,
        lower_rate: 0,
        higher_rate: 0,
        break_override: null,
        actual_hours: 27000000,
        overrun_hours: 0,
        weekly_hours: 0.0,
        half_is_all_ush: 1,
        break_from_higher: 0,
        leave_relief_ush_type: "best",
    },
];

// Function to map the shifts
const mapShifts = (shifts) =>
    shifts.map(
        ({
            actual_to,
            from,
            overrun_type,
            planned_to,
            type,
            absent_hours,
            double,
            flat,
            higher_rate,
            lower_rate,
            time_and_half,
            toil,
            weekly_hours,
            half_is_all_ush,
            break_from_higher,
            leave_relief_ush_type,
        }) => ({
            params: { actual_to, from, overrun_type, planned_to, type },
            options: {
                weekly_hours,
                half_is_all_ush: !!half_is_all_ush,
                break_from_higher: !!break_from_higher,
                leave_relief_ush_type,
            },
            result: {
                absent_hours,
                double,
                flat,
                higher_rate,
                lower_rate,
                time_and_half,
                toil,
            },
        })
    );

const outputJson = JSON.stringify(mapShifts(raw));

try {
    const platform = process.platform;
    if (platform === "darwin") {
        execSync(`echo "${outputJson.replace(/"/g, '\\"')}" | pbcopy`);
    } else if (platform === "win32") {
        execSync(`echo ${outputJson} | clip`);
    } else {
        // Linux: try xclip first, fallback to xsel
        try {
            execSync(
                `echo "${outputJson.replace(/"/g, '\\"')}" | xclip -selection clipboard`
            );
        } catch {
            execSync(
                `echo "${outputJson.replace(/"/g, '\\"')}" | xsel --clipboard`
            );
        }
    }
    console.log("Mapped shifts copied to clipboard!");
} catch (err) {
    console.error("Failed to copy to clipboard:", err.message);
}
