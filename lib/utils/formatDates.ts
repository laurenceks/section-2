import { validateTimestamp } from "./validateTimestamp";

const regExpDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const suffixes = {
    one: "st",
    two: "nd",
    few: "rd",
    other: "th",
    zero: "",
    many: "",
};

export const formatDate = (
    dt: string | number | Date | null | undefined,
    format:
        | "do mmm"
        | "dd/mm/yy"
        | "dd/mm/yy hh:mm"
        | "dd/mm/yyyy"
        | "dd/mm/yyyy (ddd)"
        | "d mmm"
        | "dd mmm yy"
        | "mmm yyyy"
        | "yy-mm"
        | "yyyy-mm-dd"
        | "yyyy-mm-dd hh:mm:ss"
        | "hh:mm"
        | "iso"
        | "sorting"
        | "long"
        | "pay"
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
            case "long":
                return `${jsDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                })} ${jsDate.getDate()}${
                    suffixes[
                        new Intl.PluralRules("en-GB", {
                            type: "ordinal",
                        }).select(jsDate.getDate())
                    ]
                } ${jsDate.toLocaleDateString("en-GB", {
                    month: "long",
                })} ${jsDate.getFullYear()}`;
            case "do mmm":
                return `${jsDate.getDate()}${
                    suffixes[
                        new Intl.PluralRules("en-GB", {
                            type: "ordinal",
                        }).select(jsDate.getDate())
                    ]
                } ${jsDate.toLocaleDateString("en-GB", {
                    month: "short",
                })}`;
            case "d mmm":
                return jsDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                });
            case "dd mmm yy":
                return jsDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                });
            case "dd/mm/yy":
                return jsDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                });
            case "dd/mm/yyyy (ddd)":
                return `${jsDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                })} (${jsDate.toLocaleDateString("en-GB", { weekday: "short" })})`;
            case "dd/mm/yy hh:mm":
                return jsDate.toLocaleDateString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                });
            case "dd/mm/yyyy":
                return jsDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });
            case "mmm yyyy":
                return jsDate.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                });
            case "yy-mm":
                return jsDate
                    .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                    })
                    .split("/")
                    .reverse()
                    .slice(0, 2)
                    .join("-");
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
            case "yyyy-mm-dd hh:mm:ss":
                return `${jsDate
                    .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    })
                    .split("/")
                    .reverse()
                    .join("-")} ${jsDate.toLocaleTimeString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })}`;
            case "hh:mm":
                return jsDate.toLocaleTimeString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                });
            case "pay":
                return `${jsDate.toLocaleDateString("en-GB", { month: "long" })} (${jsDate.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    }
                )})`;
            case "iso":
            default:
                return jsDate.toISOString();
        }
    }
    return "";
};

export const addHoursToTimeStamp = (
    timestamp = "",
    hours = 0,
    returnType: string | null = "iso"
) => {
    // only accept YYYY-MM-DD HH:mm:ss, ISO or date object
    if (validateTimestamp(timestamp)) {
        const currentTimestamp = new Date(timestamp);
        const returnTimestamp = new Date(
            currentTimestamp.setTime(
                currentTimestamp.getTime() + hours * 60 * 60 * 1000
            )
        );
        if (returnType === "iso") {
            return returnTimestamp.toISOString();
        }
        if (returnType === "sortingDate") {
            return returnTimestamp.toISOString().split("T")[0];
        }
        return returnTimestamp;
    }
    return null;
};

export const timeStampsDoNotOverlap = (
    isoOneFrom = "",
    isoOneTo = "",
    isoTwoFrom = "",
    isoTwoTo = ""
) => {
    // only accept YYYY-MM-DD HH:mm:ss, ISO or date object
    if (
        validateTimestamp(isoOneFrom) &&
        validateTimestamp(isoOneTo) &&
        validateTimestamp(isoTwoFrom) &&
        validateTimestamp(isoTwoTo)
    ) {
        const f1 = new Date(isoOneFrom);
        const t1 = new Date(isoOneTo);
        const f2 = new Date(isoTwoFrom);
        const t2 = new Date(isoTwoTo);
        if (f1 < f2) {
            return t1 <= f2;
        }
        return f1 >= t2;
    }
    return true;
};

export const addDaysToTimestamp = (date: string | Date = "", days = 0) => {
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
};

export const getPreviousMonday = (d: string | Date) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    return dt;
};
