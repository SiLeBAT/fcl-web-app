import {
    DeliveryHighlightingRule,
    HighlightingRule,
    HighlightingStats,
    LinePatternType,
    StationHighlightingRule,
} from "../data.model";
import { InternalError } from "../io/io-errors";
import { isEditRuleValid } from "./edit-rule-validaton";
import {
    ColorAndShapeEditRule,
    ColorEditRule,
    ComposedLabelEditRule,
    DeliveryEditRule,
    DeliveryRuleType,
    EdgeWidthEditRule,
    EditRule,
    EditRuleCore,
    InvEditRule,
    LabelEditRule,
    RuleListItem,
    RuleType,
    StationEditRule,
    StationRuleType,
} from "./model";
import { isSimpleLabelRule } from "./shared";
import { ComplexFilterUtils } from "./shared/complex-filter-utils";

function convertEditRuleToHRule(editRule: EditRule): HighlightingRule {
    return {
        id: editRule.id,
        name: editRule.name,
        userDisabled: editRule.userDisabled,
        autoDisabled: false,
        logicalConditions:
            ComplexFilterUtils.complexFilterConditionsToLogicalConditions(
                editRule.complexFilterConditions,
            ),
        labelProperty: null,
        labelParts: undefined,
        showInLegend: false,
        color: null,
        adjustThickness: false,
        valueCondition: null,
        invisible: false,
    };
}

function convertLabelEditRuleToHRule(
    editRule: LabelEditRule,
): HighlightingRule {
    const hRule: HighlightingRule = {
        ...convertEditRuleToHRule(editRule),
    };
    if (isSimpleLabelRule(editRule)) {
        hRule.labelProperty = editRule.labelProperty;
    } else {
        hRule.labelParts = editRule.labelParts;
        hRule.labelPrefix = editRule.labelPrefix;
    }
    return hRule;
}

function convertHRuleToStatHRule(
    rule: HighlightingRule,
): StationHighlightingRule {
    return {
        ...rule,
        shape: null,
    };
}

function convertHRuleToDeliveryHRule(
    rule: HighlightingRule,
): DeliveryHighlightingRule {
    return {
        ...rule,
        linePattern: LinePatternType.SOLID,
    };
}

function convertLabelEditRuleToStatHRule(
    editRule: LabelEditRule | ComposedLabelEditRule,
): StationHighlightingRule {
    return convertHRuleToStatHRule(convertLabelEditRuleToHRule(editRule));
}

function convertLabelEditRuleToDeliveryHRule(
    editRule: LabelEditRule,
): DeliveryHighlightingRule {
    return convertHRuleToDeliveryHRule(convertLabelEditRuleToHRule(editRule));
}

function convertEdgeWidthEditRuleToHighlitingRule(
    editRule: EdgeWidthEditRule,
): DeliveryHighlightingRule {
    if (!isEditRuleValid(editRule)) {
        throw new InternalError(
            "Attempting to save rule failed. Rule is Invalid.",
        );
    }
    return {
        ...convertEditRuleToHRule(editRule),
        linePattern: null,
        adjustThickness: true,
        valueCondition: {
            propertyName: editRule.propertyName!,
            useZeroAsMinimum: editRule.minimumZero,
            valueType: editRule.scale!,
        },
    };
}

function convertInvEditRuleToHRule(editRule: InvEditRule): HighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        invisible: true,
    };
}

function convertInvEditRuleToStatHRule(
    editRule: InvEditRule,
): StationHighlightingRule {
    return convertHRuleToStatHRule(convertInvEditRuleToHRule(editRule));
}

function convertInvEditRuleToDeliveryHRule(
    editRule: InvEditRule,
): DeliveryHighlightingRule {
    return convertHRuleToDeliveryHRule(convertInvEditRuleToHRule(editRule));
}

function convertCSEditRuleToStatHRule(
    editRule: ColorAndShapeEditRule,
): StationHighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        color: editRule.color,
        shape: editRule.shape,
        showInLegend: editRule.showInLegend,
    };
}

function convertColorEditRuleToDeliveryHRule(
    editRule: ColorEditRule,
): DeliveryHighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        color: editRule.color,
        showInLegend: editRule.showInLegend,
        linePattern: null,
    };
}

export function convertStationEditRuleToHRule(
    editRule: StationEditRule,
): StationHighlightingRule {
    switch (editRule.type) {
        case RuleType.COLOR_AND_SHAPE:
            return convertCSEditRuleToStatHRule(
                editRule as ColorAndShapeEditRule,
            );
        case RuleType.LABEL:
            return convertLabelEditRuleToStatHRule(
                editRule as LabelEditRule | ComposedLabelEditRule,
            );
        case RuleType.INVISIBILITY:
            return convertInvEditRuleToStatHRule(editRule as InvEditRule);
        default:
            throw new Error("Rule not convertable.");
    }
}

export function convertDeliveryEditRuleToHRule(
    editRule: DeliveryEditRule,
): DeliveryHighlightingRule {
    switch (editRule.type) {
        case RuleType.COLOR:
            return convertColorEditRuleToDeliveryHRule(
                editRule as ColorEditRule,
            );
        case RuleType.LABEL:
            return convertLabelEditRuleToDeliveryHRule(
                editRule as LabelEditRule,
            );
        case RuleType.INVISIBILITY:
            return convertInvEditRuleToDeliveryHRule(editRule as InvEditRule);
        case RuleType.EDGE_WIDTH:
            return convertEdgeWidthEditRuleToHighlitingRule(editRule);
        default:
            throw new Error("Rule not convertable.");
    }
}

function convertHRuleToEditRuleCore(rule: HighlightingRule): EditRuleCore {
    return {
        id: rule.id,
        name: rule.name,
        userDisabled: rule.userDisabled,
        complexFilterConditions:
            ComplexFilterUtils.logicalConditionsToComplexFilterConditions(
                rule.logicalConditions,
            ),
        isValid: true,
    };
}

export function convertStatHRuleToCSEditRule(
    rule: StationHighlightingRule,
): ColorAndShapeEditRule {
    return {
        ...convertHRuleToEditRuleCore(rule),
        type: RuleType.COLOR_AND_SHAPE,
        color: rule.color,
        shape: rule.shape,
        showInLegend: rule.showInLegend,
    };
}

export function convertDeliveryHRuleToColorEditRule(
    rule: DeliveryHighlightingRule,
): ColorEditRule {
    return {
        ...convertHRuleToEditRuleCore(rule),
        type: RuleType.COLOR,
        color: rule.color!,
        showInLegend: rule.showInLegend,
    };
}

export function convertHRuleToLabelEditRule(
    rule: HighlightingRule,
): LabelEditRule {
    return {
        ...convertHRuleToEditRuleCore(rule),
        type: RuleType.LABEL,
        ...(rule.labelParts
            ? {
                  labelParts: rule.labelParts,
                  labelPrefix: rule.labelPrefix ?? "",
              }
            : { labelProperty: rule.labelProperty }),
    };
}

export function convertHRuleToComposedLabelEditRule(
    rule: HighlightingRule,
): ComposedLabelEditRule {
    return {
        ...convertHRuleToEditRuleCore(rule),
        type: RuleType.LABEL,
        labelParts: rule.labelParts!,
        labelPrefix: rule.labelPrefix ?? "",
    };
}

function convertHRuleToInvEditRule(rule: HighlightingRule): InvEditRule {
    return this.convertHRuleToEditRule(rule);
}

function convertHighlitingRuleToEdgeWidthEditRule(
    rule: HighlightingRule,
): EdgeWidthEditRule {
    return {
        ...convertHRuleToEditRuleCore(rule),
        type: RuleType.EDGE_WIDTH,
        propertyName: rule.valueCondition?.propertyName ?? null,
        scale: rule.valueCondition?.valueType ?? null,
        minimumZero: rule.valueCondition?.useZeroAsMinimum ?? false,
    };
}

export function convertStationHRuleToEditRule(
    rule: StationHighlightingRule,
): StationEditRule {
    if (rule.color || rule.shape) {
        return convertStatHRuleToCSEditRule(rule);
    } else if (rule.labelProperty) {
        return convertHRuleToLabelEditRule(rule);
    } else if (rule.labelParts) {
        return convertHRuleToComposedLabelEditRule(rule);
    } else if (rule.invisible) {
        return convertHRuleToInvEditRule(rule);
    } else {
        throw new Error(
            "Station Highlighting Rule cannot be converted to EditRule.",
        );
    }
}

export function convertDeliveryHRuleToEditRule(
    rule: DeliveryHighlightingRule,
): DeliveryEditRule {
    if (rule.color) {
        return convertDeliveryHRuleToColorEditRule(rule);
    } else if (rule.labelProperty) {
        return convertHRuleToLabelEditRule(rule);
    } else if (rule.invisible) {
        return convertHRuleToInvEditRule(rule);
    } else if (rule.adjustThickness) {
        return convertHighlitingRuleToEdgeWidthEditRule(rule);
    } else {
        throw new Error(
            "Delivery Highlighting Rule cannot be converted to EditRule.",
        );
    }
}

export function getStatRuleType(
    rule: StationHighlightingRule,
): StationRuleType | null {
    if (rule.color || rule.shape) {
        return RuleType.COLOR_AND_SHAPE;
    } else if (rule.labelProperty || rule.labelParts) {
        return RuleType.LABEL;
    } else {
        return null;
    }
}

export function getDeliveryRuleType(
    rule: DeliveryHighlightingRule,
): DeliveryRuleType | null {
    if (rule.color) {
        return RuleType.COLOR;
    } else if (rule.labelProperty) {
        return RuleType.LABEL;
    } else if (rule.adjustThickness) {
        return RuleType.EDGE_WIDTH;
    } else {
        return null;
    }
}

function convertHRuleToRuleListItem(
    rule: HighlightingRule,
    stats: HighlightingStats,
): Omit<RuleListItem, "ruleType"> {
    return {
        id: rule.id,
        name: rule.name,
        color: rule.color,
        shape: null,
        showInLegend: rule.showInLegend,
        autoDisabled: rule.autoDisabled,
        isAnonymizationRule: !!rule.labelParts,
        disabled: rule.userDisabled || rule.autoDisabled,
        effElementsCount: stats.counts[rule.id] || 0,
        conflictCount: stats.conflicts[rule.id] || 0,
        effElementsCountTooltip: "",
    };
}

export function convertStationHRuleToRuleListItem(
    rule: StationHighlightingRule,
    stats: HighlightingStats,
): RuleListItem {
    const item = convertHRuleToRuleListItem(rule, stats);
    const result = {
        ...item,
        shape: rule.shape,
        ruleType: getStatRuleType(rule),
    };
    addTooltipToStatRuleListItem(result);
    return result;
}

export function convertDeliveryHRuleToRuleListItem(
    rule: DeliveryHighlightingRule,
    stats: HighlightingStats,
): RuleListItem {
    const item = convertHRuleToRuleListItem(rule, stats);
    const result = {
        ...item,
        ruleType: getDeliveryRuleType(rule),
    };
    addTooltipToDeliveryRuleListItem(result);
    return result;
}

function addTooltipToDeliveryRuleListItem(ruleListItem: RuleListItem): void {
    if (ruleListItem.disabled) {
        // do nothing
    } else {
        ruleListItem.effElementsCountTooltip = `This highlighting rule applies to ${ruleListItem.effElementsCount} deliveries.`;
    }
}

function addTooltipToStatRuleListItem(ruleListItem: RuleListItem): void {
    if (ruleListItem.disabled) {
        // do nothing
    } else if (ruleListItem.conflictCount > 0) {
        ruleListItem.effElementsCountTooltip =
            `For ${ruleListItem.conflictCount}/${ruleListItem.effElementsCount} stations the shape is not visible\n` +
            "due to another rule above this one.";
    } else {
        ruleListItem.effElementsCountTooltip = `This highlighting rule applies to ${ruleListItem.effElementsCount} stations.`;
    }
}
