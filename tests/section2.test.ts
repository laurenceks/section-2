import {
    calculateAdditionalHours,
    calculateSection2,
    calculateUsh,
    Section2Params,
} from "../src";
import { section2Expectations } from "./expectations/section2";
import { invalidArgumentsExpectations } from "./expectations/invalidArguments";

const toHours = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === "number" ? v / 3600000 : v,
        ])
    );

Object.entries(section2Expectations).forEach(
    ([key, arr]: [
        keyof typeof section2Expectations,
        (typeof section2Expectations)[keyof typeof section2Expectations],
    ]) => {
        describe(key, () => {
            arr.forEach((x) => {
                test(
                    x.params.name ||
                        `${x.params.from} - ${x.params.planned_to} (${x.params.actual_to})`,
                    () => {
                        expect(
                            toHours(calculateSection2(x.params, x.options))
                        ).toEqual(toHours(x.result));
                    }
                );
            });
        });
    }
);

const funcs = [calculateSection2, calculateAdditionalHours, calculateUsh];
const errorResults = [
    {
        absent_hours: 0,
        double: 0,
        flat: 0,
        higher_rate: 0,
        lower_rate: 0,
        time_and_half: 0,
        toil: 0,
    },
    {
        absent_hours: 0,
        double: 0,
        flat: 0,
        time_and_half: 0,
        toil: 0,
    },
    {
        higher_rate: 0,
        lower_rate: 0,
    },
];
const namePrefixes = ["S2", "AH", "USH"];

describe("Invalid arguments", () => {
    invalidArgumentsExpectations.forEach(
        (x: (typeof invalidArgumentsExpectations)[number]) => {
            test(`${namePrefixes[x.function ?? 0]} ${x.name}`, () => {
                expect(
                    x.function
                        ? funcs[x.function](
                              x.params as Section2Params,
                              x.options
                          )
                        : calculateSection2(
                              x.params as Section2Params,
                              x.options
                          )
                ).toEqual(x.result || errorResults[x.function ?? 0]);
            });
        }
    );
});
