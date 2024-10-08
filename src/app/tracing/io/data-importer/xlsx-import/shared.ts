import { removeUndefined } from "../../../../tracing/util/non-ui-utils";
import { IMPORT_ISSUES, IMPORT_PREFIXES } from "./consts";
import {
    AddIssueCallback,
    ColumnMapping,
    DeliveryRow,
    ImportIssue,
    ImportTable,
    MappingDef,
    NumberTypeString,
    RefinedTypeString,
    StationRow,
} from "./model";
import { BasicTypeString, CellValue, Row, Table } from "./xlsx-reader";
import * as _ from "lodash";

type TypeString2Type<T extends RefinedTypeString> = T extends NumberTypeString
    ? number
    : T extends "string"
      ? string
      : T extends "boolean"
        ? boolean
        : never;

interface AmountColumns {
    number: number;
    unit: number;
}

export function createEmptyImportTable<T>(): ImportTable<T> {
    return {
        issues: [],
        columns: [],
        rows: [],
        omittedRows: 0,
    };
}

const LATITUDE_LIMITS = {
    min: -90,
    max: 90,
} as const;

const LONGITUDE_LIMITS = {
    min: -180,
    max: 180,
} as const;

export function getOtherPropsFromCollumnMapping(
    fromRow: Row,
    columnMappings: ColumnMapping[],
    addIssueCb: AddIssueCallback,
): Record<string, CellValue> {
    const properties: Record<string, CellValue> = {};
    columnMappings.forEach((columnMapping) => {
        const value = importValue(
            fromRow,
            columnMapping.fromIndex,
            columnMapping.type,
            addIssueCb,
        );
        if (value !== undefined) {
            properties[columnMapping.toPropId] = value;
        }
    });
    return properties;
}

export function getPropsFromCollumnMapping<T>(
    fromRow: Row,
    columnMappings: ColumnMapping[],
    addIssueCb: AddIssueCallback,
): Partial<T> {
    const properties: Partial<T> = {};
    columnMappings.forEach((columnMapping) => {
        const value = importValue(
            fromRow,
            columnMapping.fromIndex,
            columnMapping.type,
            addIssueCb,
        );
        if (value !== undefined) {
            properties[columnMapping.toPropId] = value;
        }
    });
    return properties;
}

export function enrichImportIssue(
    issue: ImportIssue,
    row: Row,
    table: Table,
    invalidateRow: boolean,
    ref?: string | undefined,
): ImportIssue {
    issue = { ...issue };
    issue.row ??= row?.rowIndex;
    if (ref !== undefined) {
        issue.ref ??= ref;
    }
    if (invalidateRow) {
        issue.invalidatesRow = true;
    }
    if (issue.col !== undefined && issue.colRef === undefined) {
        // col is supposed to be the zero based relative index in the table
        if (row[issue.col] !== undefined) {
            issue.value = row[issue.col];
        }
        issue.colRef = table.header.columnHeaders[issue.col];
        issue.col += table.offset.col;
        // col is now an absolute 1 based index
    }
    return issue;
}

function getMergedType(
    types: Set<BasicTypeString>,
): BasicTypeString | undefined {
    switch (types.size) {
        case 0:
            return undefined;
        case 1:
            return Array.from(types)[0];
        default:
            return "string";
    }
}

export function getOtherColumns(
    table: Table,
    startIndex: number,
    ignoreIndices: number[],
): ColumnMapping[] {
    const ignoreIndicesSet = new Set(ignoreIndices);
    const columnMappings = table.header.columnHeaders.map((h, index) => ({
        fromIndex: index,
        toPropId: h.join("_"),
        type: getMergedType(table.columns[index].types),
    }));

    const filteredColumnMappings = columnMappings.filter(
        (col) =>
            col.fromIndex >= startIndex &&
            !ignoreIndicesSet.has(col.fromIndex) &&
            col.type !== undefined,
    ) as ColumnMapping[];
    return filteredColumnMappings;
}

export function getOptionalColumnMapping<T>(
    table: Table,
    mappingDef: MappingDef<T>,
): ColumnMapping[] {
    const columnMappings: ColumnMapping[] = [];
    const optionalColRefs = Object.keys(mappingDef) as (keyof MappingDef<T> &
        string)[];
    optionalColRefs.forEach((colRef) => {
        const expectedHeader = mappingDef[colRef]?.header;
        const columnIndex = table.header.columnHeaders.findIndex(
            (observedHeader) => _.isEqual(expectedHeader, observedHeader),
        );
        if (columnIndex >= 0) {
            if (table.columns[columnIndex].types.size > 0) {
                columnMappings.push({
                    fromIndex: columnIndex,
                    toPropId: colRef,
                    type: mappingDef[colRef]!.type,
                });
            }
        }
    });
    return columnMappings;
}

export function getCleanedStringOrUndefined(
    value: CellValue | undefined,
): string | undefined {
    if (typeof value === "string") {
        return value.trim() || undefined;
    } else if (value !== undefined) {
        return `${value}`;
    }
    return undefined;
}

function getCleanedInput(value: CellValue | undefined): CellValue | undefined {
    if (typeof value === "string") {
        return value.trim() || undefined;
    }
    return value;
}

function getLat(lat: any): number | undefined {
    return typeof lat === "number" &&
        !Number.isNaN(lat) &&
        isInRange(lat, LATITUDE_LIMITS.min, LATITUDE_LIMITS.max)
        ? lat
        : undefined;
}

function getLon(lon: any): number | undefined {
    return typeof lon === "number" &&
        !Number.isNaN(lon) &&
        isInRange(lon, LONGITUDE_LIMITS.min, LONGITUDE_LIMITS.max)
        ? lon
        : undefined;
}

function getBoolean(value: any): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function getNumber(value: any): number | undefined {
    return typeof value === "number" && !Number.isNaN(value)
        ? value
        : undefined;
}

export function getStringOrUndefined(value: any): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function getNonNegNumber(value: any): number | undefined {
    return typeof value === "number" && !Number.isNaN(value) && value >= 0
        ? value
        : undefined;
}

const TYPESTRING_2_FUN = {
    lat: getLat,
    lon: getLon,
    "nonneg:number": getNonNegNumber,
    number: getNumber,
    string: getStringOrUndefined,
    boolean: getBoolean,
} as const satisfies {
    [T in RefinedTypeString]: (
        x: CellValue | undefined,
    ) => TypeString2Type<T> | undefined;
};

function conditionalConcat(
    arr: (string | number | boolean | undefined)[],
    sep: string,
): string | undefined {
    arr = removeUndefined(arr);
    const filteredArr = removeUndefined(arr);
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

export function importValue<X extends RefinedTypeString>(
    row: Row,
    colIndex: number,
    reqType: X,
    addIssueCb: AddIssueCallback,
    required = false,
    invalidateRow = false,
): TypeString2Type<X> | undefined {
    const inputValue = getCleanedInput(row[colIndex]);
    let value: TypeString2Type<X> | undefined;
    if (inputValue === undefined) {
        if (required) {
            addIssueCb(
                {
                    col: colIndex,
                    type: "error",
                    msg: IMPORT_ISSUES.missingValue,
                },
                invalidateRow,
            );
        }
    } else {
        value = TYPESTRING_2_FUN[reqType](inputValue) as
            | TypeString2Type<X>
            | undefined;
        if (value === undefined) {
            addIssueCb(
                {
                    col: colIndex,
                    type: "error",
                    msg: IMPORT_ISSUES.invalidValue,
                },
                invalidateRow,
            );
        }
    }
    return value;
}

export function importStationReference(
    row: Row,
    colIndex: number,
    allowedValues: { has: (x: string) => boolean },
    addIssueCb: AddIssueCallback,
): string | undefined {
    return importRef(row, colIndex, allowedValues, addIssueCb);
}

export function importDeliveryRef(
    row: Row,
    colIndex: number,
    allowedValues: { has: (x: string) => boolean },
    addIssueCb: AddIssueCallback,
): string | undefined {
    return importRef(row, colIndex, allowedValues, addIssueCb);
}

export function importRef(
    row: Row,
    colIndex: number,
    allowedValues: { has: (x: string) => boolean },
    addIssueCb: AddIssueCallback,
): string | undefined {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.missingValue,
            },
            true,
        );
    } else if (!allowedValues.has(inputValue)) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.invalidRef,
            },
            true,
        );
    }
    return inputValue;
}

// I wonder if it would be better if these lowest level import functions simply returned their error,
// instead of having to handle addIssueCb and returning undefined?
export function importPrimaryKey(
    row: Row,
    colIndex: number,
    usedPks: { has: (x: string) => boolean },
): string | ImportIssue {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        return {
            col: colIndex,
            type: "error",
            msg: IMPORT_ISSUES.missingValue,
        };
    } else if (usedPks.has(inputValue)) {
        return {
            col: colIndex,
            type: "error",
            msg: IMPORT_ISSUES.nonUniqueValue,
        };
    }
    return inputValue;
}

export function importMandatoryString(
    row: Row,
    colIndex: number,
    addIssueCb: AddIssueCallback,
): string | undefined {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        addIssueCb({
            col: colIndex,
            type: "error",
            msg: IMPORT_ISSUES.missingValue,
        });
        return undefined;
    }
    return inputValue;
}

export function importAggregateAmount(
    row: Row,
    amountColumns: AmountColumns,
): string | undefined {
    return conditionalConcat(
        [
            getCleanedStringOrUndefined(row[amountColumns.number]),
            getCleanedStringOrUndefined(row[amountColumns.unit]),
        ],
        " ",
    );
}

export function getLongUniqueStationId(station: Partial<StationRow>): string {
    const uniqueId = JSON.stringify({
        name: station.name,
        address: station.address,
    });
    return uniqueId;
}

export function getLongUniqueDeliveryId(
    delivery: Partial<DeliveryRow>,
): string {
    const uniqueId = JSON.stringify({
        source: delivery.source,
        target: delivery.target,
        productName: delivery.productName,
        lotNumber: delivery.lotNumber,
        dateOut: delivery.dateOut,
        dateIn: delivery.dateIn,
        amount: delivery.unitAmount,
    });
    return uniqueId;
}

function getShortUniquePrefixedHash(
    text: string,
    valuesToExclude: Set<string>,
    prefix: string,
): string {
    let code = Math.abs(getHashCode(text));
    const codeToPrefixedHash = (x: number) => `${prefix}${x}`;
    let prefixedHash = codeToPrefixedHash(code);
    while (valuesToExclude.has(prefixedHash)) {
        code++;
        prefixedHash = codeToPrefixedHash(code);
    }
    return prefixedHash;
}

export function getShortUniqueDeliveryIdFromLongId(
    fullId: string,
    idsToExclude: Set<string>,
): string {
    return getShortUniquePrefixedHash(
        fullId,
        idsToExclude,
        IMPORT_PREFIXES.deliveryId,
    );
}

export function getShortUniqueStationIdFromLongId(
    fullId: string,
    idsToExclude: Set<string>,
): string {
    return getShortUniquePrefixedHash(
        fullId,
        idsToExclude,
        IMPORT_PREFIXES.stationId,
    );
}

function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

function getValidIntegerInRangeOrUndefined(
    value: any,
    min: number,
    max: number,
): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    const numValue = getNumValue(value);
    return !Number.isNaN(numValue) &&
        Number.isInteger(numValue) &&
        isInRange(numValue, min, max)
        ? numValue
        : undefined;
}

function getNumValue(value) {
    switch (typeof value) {
        case "number":
            return value;
        case "string":
            return Number(value);
        default:
            return NaN;
    }
}

function getValidYearOrUndefined(
    inputYear: CellValue | undefined,
): number | undefined {
    return getValidIntegerInRangeOrUndefined(inputYear, 1000, 9999);
}

function getValidMonthOrUndefined(
    inputMonth: CellValue | undefined,
): number | undefined {
    return getValidIntegerInRangeOrUndefined(inputMonth, 1, 12);
}

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getValidDayOrUndefined(
    day: CellValue | undefined,
    month: number | undefined,
    year: number | undefined,
): number | undefined {
    const numDay = getValidIntegerInRangeOrUndefined(day, 1, 31);
    if (numDay !== undefined) {
        if (month !== undefined) {
            if (
                (month === 2 &&
                    (numDay > 29 ||
                        (numDay > 28 &&
                            year !== undefined &&
                            !isLeapYear(year)))) ||
                (month > 30 && [4, 6, 9, 11].includes(month))
            ) {
                return undefined;
            }
        }
    }
    return numDay;
}

function getFormatedStrDate(
    year: number | undefined,
    month: number | undefined,
    day: number | undefined,
): string | undefined {
    const dateParts: string[] = [];
    if (year !== undefined) {
        dateParts.push(`${String(year).padStart(4, "0")}`);
        if (month !== undefined) {
            dateParts.push(`${String(month).padStart(2, "0")}`);
            if (day !== undefined) {
                dateParts.push(`${String(day).padStart(2, "0")}`);
            }
        }
    }
    return dateParts.length > 0 ? dateParts.join("-") : undefined;
}

export function importStringDate(
    row: Row,
    dateCols: {
        y: number;
        m: number;
        d: number;
    },
    addIssueCb: AddIssueCallback,
    invalidateRow = false,
): string | undefined {
    const inputYear = row[dateCols.y];
    const year = getValidYearOrUndefined(inputYear);
    const inputMonth = row[dateCols.m];
    const month = getValidMonthOrUndefined(inputMonth);
    const inputDay = row[dateCols.d];
    const day = getValidDayOrUndefined(inputDay, month, year);

    if (inputYear !== undefined && year === undefined) {
        addIssueCb(
            {
                col: dateCols.y,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    if (inputMonth !== undefined && month === undefined) {
        addIssueCb(
            {
                col: dateCols.m,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    if (inputDay !== undefined && day === undefined) {
        addIssueCb(
            {
                col: dateCols.d,
                row: row.rowIndex,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    return getFormatedStrDate(year, month, day);
}

function getHashCode(text: string): number {
    let h = 0;
    const l = text.length;
    let i = 0;
    if (l > 0) {
        while (i < l) {
            // eslint-disable-next-line no-bitwise
            h = ((h << 5) - h + text.charCodeAt(i++)) | 0;
        }
    }
    return h;
}
