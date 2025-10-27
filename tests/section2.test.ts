import { calculateSection2, Section2, Section2Params } from "../src";
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

const errorResult: Section2 = {
    absent_hours: 0,
    double: 0,
    flat: 0,
    higher_rate: 0,
    lower_rate: 0,
    time_and_half: 0,
    toil: 0,
};

describe("Invalid arguments", () => {
    invalidArgumentsExpectations.forEach((x) => {
        test(x.name, () => {
            expect(
                calculateSection2(x.params as Section2Params, x.options)
            ).toEqual(x.result || errorResult);
        });
    });
});
