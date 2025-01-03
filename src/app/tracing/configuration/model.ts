import {
    Color,
    DataServiceInputState,
    LabelPart,
    NodeShapeType,
    TableColumn,
    TableRow,
    ValueType,
} from "../data.model";
import { ComplexFilterCondition, PropToValuesMap } from "./configuration.model";

export interface RowFilter<T> {
    filter(arr: TableRow[]): TableRow[];
    getSettings(): T;
}

export interface TextFilterSettings {
    filterTerm: string;
    filterProps: string[];
}

export enum TableType {
    STATIONS,
    DELIVERIES,
}

export type TreeStatus = "collapsed" | "expanded";

export interface EditHighlightingServiceData {
    favouriteProperties: TableColumn[];
    otherProperties: TableColumn[];
    propToValuesMap: PropToValuesMap;
    ruleListItems: RuleListItem[];
}

export interface RuleListItem {
    id: RuleId;
    name: string;
    color: Color | null;
    shape: NodeShapeType | null;
    showInLegend: boolean;
    disabled: boolean;
    autoDisabled: boolean;
    isAnonymizationRule: boolean;
    effElementsCountTooltip: string;
    effElementsCount: number;
    conflictCount: number;
    ruleType: RuleType | null;
}

export interface EditRuleCore {
    id: string;
    name: string;
    userDisabled: boolean;
    complexFilterConditions: ComplexFilterCondition[];
    isValid: boolean;
}

export type EditRule =
    | ColorAndShapeEditRule
    | ColorEditRule
    | LabelEditRule
    | InvEditRule
    | EdgeWidthEditRule;

export enum RuleType {
    INVISIBILITY,
    LABEL,
    COLOR_AND_SHAPE,
    COLOR,
    EDGE_WIDTH,
}

export interface EdgeWidthEditRule extends EditRuleCore {
    type: RuleType.EDGE_WIDTH;
    minimumZero: boolean;
    maximum?: number;
    scale: ValueType | null;
    propertyName: string | null;
}

export interface ColorAndShapeEditRule extends EditRuleCore {
    type: RuleType.COLOR_AND_SHAPE;
    showInLegend: boolean;
    color: Color | null;
    shape: NodeShapeType | null;
}

export interface ColorEditRule extends EditRuleCore {
    type: RuleType.COLOR;
    showInLegend: boolean;
    color: Color;
}

export interface SimpleLabelEditRule extends EditRuleCore {
    type: RuleType.LABEL;
    labelProperty: string | null;
}

export interface ComposedLabelEditRule extends EditRuleCore {
    type: RuleType.LABEL;
    labelParts: LabelPart[];
    labelPrefix: string;
}

export type LabelEditRule = SimpleLabelEditRule | ComposedLabelEditRule;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InvEditRule extends EditRuleCore {
    type: RuleType.INVISIBILITY;
}

export type StationEditRule =
    | ColorAndShapeEditRule
    | LabelEditRule
    | InvEditRule;
export type DeliveryEditRule =
    | LabelEditRule
    | InvEditRule
    | ColorEditRule
    | EdgeWidthEditRule;

export type DeliveryRuleType =
    | RuleType.LABEL
    | RuleType.COLOR
    | RuleType.EDGE_WIDTH;
export type StationRuleType = RuleType.LABEL | RuleType.COLOR_AND_SHAPE;

export type RuleId = string;

export interface EditHighlightingState<T extends EditRule> {
    dataServiceInputState: DataServiceInputState;
    editRules: T[];
}
