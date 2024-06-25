import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';

export type Row =  Record<number, string | number | boolean>;

export type HeaderConf = string | [string, ArrayWith2OrMoreElements<HeaderConf>];

// export interface ColumnHeader {
//     label?: string;
//     // id: string;
//     columnLetter: string;
//     columnIndex: number;
//     columnCount: number;
//     isEmpty: boolean;
//     rowCount: number;
//     children?: NonEmptyArray<ColumnHeader>;
//     parent?: ColumnHeader;
//     valueTypes: Set<string>;
//     valueCount: number;
// }

export interface Worksheet {
    name: string;
    columnHeaders: ColumnHeader[];
    columnGroups: ColumnHeader[];
    columns: ColumnHeader[];
    columnCount: number;
    rows: Row[];
}

export interface Table {
    columnGroups: ColumnHeader[];
    columns: ColumnHeader[];
    rows: Row[];
    warnings: ImportWarning[];
}

export interface Workbook {
    sheetNames: string[];
    sheets: Record<string, Worksheet>;
}

export interface ColumnValueConstraints {
    isMandatory?: boolean;
    isUnique?: boolean;
}

type TransformerFun = <X, Y>(x: X) => Y;

export interface ImportWarning {
    col?: number;
    row?: number;
    warning: string;
}

export interface DatePartCols {
    yearCol: number;
    monthCol: number;
    dayCol: number;
}

// export type TypeString = 'string' | 'nonneg:number' | 'number' | 'year' | 'month';
export type AggTypeString = 'date';

type DateInput<R extends string | number> = { y: R, m: R, d: R };
type AggTypeString2InputType<T extends AggTypeString, R extends string | number> = T extends 'date' ? DateInput<R> : never;


export type TypeString = 'string' | 'nonneg:number' | 'number' | 'year' | 'month' | 'never' | 'lat' | 'lon';
export type TypeString2Type<T extends TypeString | undefined | unknown> = T extends 'nonneg:number' | 'number' | 'year' | 'month' ? number : string;

// type TypeStr2Type<T extends TypeString | undefined> = T extends 'nonneg:number' | 'number' | 'year' | 'month' ? number : string;

type AggField< R extends string | number, AR extends string, ATS extends AggTypeString> = { ref: AR; type: ATS; input: AggTypeString2InputType<ATS, R>}
export interface ReadTableOptions<R extends string | number, AR extends string> {
    offset: {
        row: number;
        col: number;
    };
    aliases: Record<Exclude<R, number>, number | undefined>;
    mandatoryValues: Readonly<R[]>;
    uniqueValues?: R[];
    controlledValues?: Partial<Record<R, Set<any>>>;
    enforceTypes?: Partial<Record<R, TypeString>>;
    aggValues: AggField<R, AR, AggTypeString>[];
    // enforceTextType?: number[];
    // enforceFkRelations?: Record<number, Set<any>>;
    // enforceNonNegNumberType?: number[];
    // enforceYearMonthDayType?: DatePartCols[];
    ignoreValues: R[];
    // columnValueConstraints?: Record<number, ColumnValueConstraints>;
    readHeader?: boolean; // default: true
    eachRowCb?: (row: Row, index: number, warnings: ImportWarning[]) => void;
}

export interface CheckColumnHeaderOptions {
    silent: boolean;
    offset: {
        col: number;
        row: number;
    };
}

export interface ColumnHeader {
    label: string[];
    colIndex: number;
}

export interface TableHeader {
    columnHeader: ColumnHeader[];
    rowCount: number;
}

export interface CellSpecs {
    text: string;
    col: number;
    row: number;
    colSpan: number;
    minRowSpan?: number;
}
