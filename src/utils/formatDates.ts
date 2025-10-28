import { validateTimestamp } from "./validateTimestamp";

const regExpDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

export const formatDate = (
    dt: string | number | Date | null | undefined,
    format: "yyyy-mm-dd" | "sorting"
): string => {
    // takes a string or date and returns a formatted string
    if (
        dt &&
        (typeof dt === "number" ||
            validateTimestamp(dt) ||
            (typeof dt === "string" && regExpDate.test(dt)))
    ) {
        const jsDate =
            typeof dt === "string" || typeof dt === "number"
                ? new Date(dt)
                : dt;
        switch (format) {
            case "sorting":
            case "yyyy-mm-dd":
                return jsDate
                    .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    })
                    .split("/")
                    .reverse()
                    .join("-");
        }
    }
    return "";
};

export const addDaysToTimestamp = (date: string | Date = "", days = 0) => {
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
};
