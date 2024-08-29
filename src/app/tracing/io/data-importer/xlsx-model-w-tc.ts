import { TypeString } from "./xlsx-model";

export type CellValue = number | string | boolean;

export type Row = {
    rowIndex: number;
    [x: number]: CellValue;
}

export interface ImportWarning {
    col?: number;
    row?: number;
    warning: string;
}

interface ColumnDefinition {
    type: TypeString;
    isMandatory?: boolean;
    isUnique?: boolean;
    // fkRefs?: Set<string | number>;
}

export interface ReadTableOptions<I extends number, M extends number>  {
    offset: {
        row: number;
        col: number;
    };
    pkIndex: string;
    columnDefinitions?: { [key: string]: ColumnDefinition };
    // refColumnIndex: number;
    // enforceTypes: Record<I, TypeString>;
    // mandatoryColumnsIndices?: MCI[];
    allowedColumnValues?: Record<number, Set<string | number>>;
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


export interface ColumnInfo {
    extJsonId?: string;
    columnIndex?: number;
}
export interface Table<T = Row> {
    header: TableHeader;
    columns: ColumnInfo[];
    rows: T[];
}