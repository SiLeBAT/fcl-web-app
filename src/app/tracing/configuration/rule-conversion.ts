import { DeliveryHighlightingRule, HighlightingRule, HighlightingStats, StationHighlightingRule } from '../data.model';
import { Utils } from '../util/non-ui-utils';
import {
    ColorAndShapeEditRule, ColorEditRule, DeliveryEditRule, DeliveryRuleType, EditRule, InvEditRule,
    LabelEditRule, RuleListItem, RuleType, StationEditRule, StationRuleType
} from './model';
import { ComplexFilterUtils } from './shared/complex-filter-utils';

function convertEditRuleToHRule(editRule: EditRule): HighlightingRule {
    return {
        id: editRule.id,
        name: editRule.name,
        disabled: editRule.disabled,
        logicalConditions: ComplexFilterUtils.complexFilterConditionsToLogicalConditions(editRule.complexFilterConditions),
        labelProperty: null,
        showInLegend: false,
        color: null,
        adjustThickness: false,
        valueCondition: null,
        invisible: false
    };
}

function convertLabelEditRuleToHRule(editRule: LabelEditRule): HighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        showInLegend: editRule.showInLegend,
        labelProperty: editRule.labelProperty
    };
}

function convertHRuleToStatHRule(rule: HighlightingRule): StationHighlightingRule {
    return {
        ...rule,
        shape: null
    };
}

function convertHRuleToDeliveryHRule(rule: HighlightingRule): DeliveryHighlightingRule {
    return {
        ...rule,
        linePattern: null
    };
}

function convertLabelEditRuleToStatHRule(editRule: LabelEditRule): StationHighlightingRule {
    return convertHRuleToStatHRule(convertLabelEditRuleToHRule(editRule));
}

function convertLabelEditRuleToDeliveryHRule(editRule: LabelEditRule): DeliveryHighlightingRule {
    return convertHRuleToDeliveryHRule(convertLabelEditRuleToHRule(editRule));
}

function convertInvEditRuleToHRule(editRule: InvEditRule): HighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        invisible: true
    };
}

function convertInvEditRuleToStatHRule(editRule: InvEditRule): StationHighlightingRule {
    return convertHRuleToStatHRule(convertInvEditRuleToHRule(editRule));
}

function convertInvEditRuleToDeliveryHRule(editRule: InvEditRule): DeliveryHighlightingRule {
    return convertHRuleToDeliveryHRule(convertInvEditRuleToHRule(editRule));
}

function convertCSEditRuleToStatHRule(editRule: ColorAndShapeEditRule): StationHighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        color: editRule.color === null ? null : Utils.colorToRGBArray(editRule.color),
        shape: editRule.shape,
        showInLegend: editRule.showInLegend
    };
}

function convertColorEditRuleToDeliveryHRule(editRule: ColorEditRule): DeliveryHighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        color: Utils.colorToRGBArray(editRule.color),
        showInLegend: editRule.showInLegend,
        linePattern: null
    };
}

export function convertStationEditRuleToHRule(editRule: StationEditRule): StationHighlightingRule {
    switch (editRule.type) {
        case RuleType.COLOR_AND_SHAPE:
            return convertCSEditRuleToStatHRule(editRule as ColorAndShapeEditRule);
        case RuleType.LABEL:
            return convertLabelEditRuleToStatHRule(editRule as LabelEditRule);
        case RuleType.INVISIBILITY:
            return convertInvEditRuleToStatHRule(editRule as InvEditRule);
        default:
            throw new Error('Rule not convertable.');
    }
}

export function convertDeliveryEditRuleToHRule(editRule: DeliveryEditRule): DeliveryHighlightingRule {
    switch (editRule.type) {
        case RuleType.COLOR:
            return convertColorEditRuleToDeliveryHRule(editRule as ColorEditRule);
        case RuleType.LABEL:
            return convertLabelEditRuleToDeliveryHRule(editRule as LabelEditRule);
        case RuleType.INVISIBILITY:
            return convertInvEditRuleToDeliveryHRule(editRule as InvEditRule);
        default:
            throw new Error('Rule not convertable.');
    }
}

function convertHRuleToEditRule(rule: HighlightingRule, ruleType: RuleType): EditRule {
    return {
        id: rule.id,
        name: rule.name,
        disabled: rule.disabled,
        complexFilterConditions: ComplexFilterUtils.logicalConditionsToComplexFilterConditions(rule.logicalConditions),
        type: ruleType,
        isValid: true
    };
}

export function convertStatHRuleToCSEditRule(rule: StationHighlightingRule): ColorAndShapeEditRule {
    return {
        ...convertHRuleToEditRule(rule, RuleType.COLOR_AND_SHAPE),
        color: rule.color === null ? null : Utils.rgbArrayToColor(rule.color),
        shape: rule.shape,
        showInLegend: rule.showInLegend
    };
}

export function convertDeliveryHRuleToColorEditRule(rule: DeliveryHighlightingRule): ColorEditRule {
    return {
        ...convertHRuleToEditRule(rule, RuleType.COLOR),
        color: Utils.rgbArrayToColor(rule.color),
        showInLegend: rule.showInLegend
    };
}

export function convertHRuleToLabelEditRule(rule: HighlightingRule): LabelEditRule {
    return {
        ...convertHRuleToEditRule(rule, RuleType.LABEL),
        labelProperty: rule.labelProperty,
        showInLegend: rule.showInLegend
    };
}

function convertHRuleToInvEditRule(rule: HighlightingRule): InvEditRule {
    return this.convertHRuleToEditRule(rule);
}

export function convertStationHRuleToEditRule(rule: StationHighlightingRule): StationEditRule {
    if (rule.color || rule.shape) {
        return convertStatHRuleToCSEditRule(rule);
    } else if (rule.labelProperty) {
        return convertHRuleToLabelEditRule(rule);
    } else if (rule.invisible) {
        return convertHRuleToInvEditRule(rule);
    } else {
        throw new Error('Station Highlighting Rule cannot be converted to EditRule.');
    }
}

export function convertDeliveryHRuleToEditRule(rule: DeliveryHighlightingRule): DeliveryEditRule {
    if (rule.color) {
        return convertDeliveryHRuleToColorEditRule(rule);
    } else if (rule.labelProperty) {
        return convertHRuleToLabelEditRule(rule);
    } else if (rule.invisible) {
        return convertHRuleToInvEditRule(rule);
    } else {
        throw new Error('Delivery Highlighting Rule cannot be converted to EditRule.');
    }
}

export function getStatRuleType(rule: StationHighlightingRule): StationRuleType | null {
    if (rule.color || rule.shape) {
        return RuleType.COLOR_AND_SHAPE;
    } else if (rule.labelProperty) {
        return RuleType.LABEL;
    } else {
        return null;
    }
}

export function getDeliveryRuleType(rule: DeliveryHighlightingRule): DeliveryRuleType | null {
    if (rule.color) {
        return RuleType.COLOR;
    } else if (rule.labelProperty) {
        return RuleType.LABEL;
    } else {
        return null;
    }
}

function convertHRuleToRuleListItem(rule: HighlightingRule, stats: HighlightingStats): Omit<RuleListItem, 'ruleType'> {
    return {
        id: rule.id,
        name: rule.name,
        color: rule.color === null ? null : Utils.rgbArrayToColor(rule.color),
        shape: null,
        showInLegend: rule.showInLegend,
        disabled: rule.disabled,
        effElementsCount: stats.counts[rule.id] || 0,
        conflictCount: stats.conflicts[rule.id] || 0,
        effElementsCountTooltip: ''
    };
}

export function convertStationHRuleToRuleListItem(rule: StationHighlightingRule, stats: HighlightingStats): RuleListItem {
    const item = convertHRuleToRuleListItem(rule, stats);
    const result = {
        ...item,
        shape: rule.shape,
        ruleType: getStatRuleType(rule)
    };
    addTooltipToStatRuleListItem(result);
    return result;
}

export function convertDeliveryHRuleToRuleListItem(rule: DeliveryHighlightingRule, stats: HighlightingStats): RuleListItem {
    const item = convertHRuleToRuleListItem(rule, stats);
    const result = {
        ...item,
        ruleType: getDeliveryRuleType(rule)
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
            'due to another rule above this one.';
    } else {
        ruleListItem.effElementsCountTooltip = `This highlighting rule applies to ${ruleListItem.effElementsCount} stations.`;
    }
}
