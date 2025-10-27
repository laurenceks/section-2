import { Section2Options, Section2Params } from "../../src";

export const invalidArgumentsExpectations: {
    name: string;
    params: Partial<Section2Params>;
    options: Section2Options;
}[] = [
    {
        name: "Invalid timestamp - impossible from",
        params: {
            actual_to: "2025-10-02 22:15:00",
            from: "2025-13-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "Invalid timestamp - impossible planned_to",
        params: {
            actual_to: "2025-10-02 22:15:00",
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-13-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "Invalid timestamp - impossible actual_to",
        params: {
            actual_to: "2025-13-02 22:15:00",
            from: "2025-13-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "Invalid timestamp - wrong format (ms with no T)",
        params: {
            actual_to: "2025-10-02 22:15:00.000+00:00",
            from: "2025-10-02 12:15:00.000+00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00.000+00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "Invalid timestamp - wrong format (slashes)",
        params: {
            actual_to: "2025/10/02 22:15:00",
            from: "2025/10/02 12:15:00",
            overrun_type: "OT",
            planned_to: "2025/10/02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "Invalid timestamp - wrong format (- time delimiter)",
        params: {
            actual_to: "2025-10-02T22-15-00",
            from: "2025-10-02T12-15-00",
            overrun_type: "OT",
            planned_to: "2025-10-02T22-00-00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "From missing",
        params: {
            actual_to: "2025-10-02 22:15:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "From empty",
        params: {
            actual_to: "2025-10-02 22:15:00",
            from: "",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "planned_to missing",
        params: {
            actual_to: "2025-10-02 22:15:00",
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "planned_to empty",
        params: {
            actual_to: "2025-10-02 22:15:00",
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            planned_to: "",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "actual_to missing - fallback to planned_to",
        params: {
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
        result: {
            absent_hours: 0,
            double: 0,
            flat: 0,
            higher_rate: 0,
            lower_rate: 7200000,
            time_and_half: 0,
            toil: 0,
        },
    },
    {
        name: "actual_to empty - fallback to planned_to",
        params: {
            actual_to: "",
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
        result: {
            absent_hours: 0,
            double: 0,
            flat: 0,
            higher_rate: 0,
            lower_rate: 7200000,
            time_and_half: 0,
            toil: 0,
        },
    },
    {
        name: "from after planned_to",
        params: {
            actual_to: "2025-10-02 22:00:00",
            from: "2025-10-02 23:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "planned_to after actual_to",
        params: {
            actual_to: "2025-10-02 22:00:00",
            from: "2025-10-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-11-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
    {
        name: "from after both actual_to and planned_to",
        params: {
            actual_to: "2025-10-02 22:00:00",
            from: "2025-11-02 12:00:00",
            overrun_type: "OT",
            planned_to: "2025-10-02 22:00:00",
            type: "Normal",
        },
        options: {},
    },
];
