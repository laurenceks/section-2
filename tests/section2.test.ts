import { section2Expectations } from "./expectations";
import { calculateSection2 } from "../src";

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
