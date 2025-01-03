import { isNotEmpty, isNotNullish } from "../util/non-ui-utils";
import { ComplexFilterCondition } from "./configuration.model";
import {
    ColorAndShapeEditRule,
    ColorEditRule,
    ComposedLabelEditRule,
    EdgeWidthEditRule,
    EditRule,
    InvEditRule,
    RuleType,
    SimpleLabelEditRule,
} from "./model";
import { isSimpleLabelRule } from "./shared";

function isConditionComplete(condition: ComplexFilterCondition): boolean {
    return (
        condition.propertyName !== null &&
        condition.operationType !== null &&
        condition.value.length > 0
    );
}

function isConditionEmpty(condition: ComplexFilterCondition): boolean {
    return condition.propertyName === null && condition.value.length === 0;
}

export function getCompleteConditionsCount(
    conditions: ComplexFilterCondition[],
): number {
    return conditions.filter((c) => isConditionComplete(c)).length;
}

export function getNonEmptyConditionCount(
    conditions: ComplexFilterCondition[],
): number {
    return conditions.filter((c) => !isConditionEmpty(c)).length;
}

function isGenericEditRuleValid(editRule: EditRule): boolean {
    return (
        editRule.name.length > 0 &&
        getCompleteConditionsCount(editRule.complexFilterConditions) ===
            getNonEmptyConditionCount(editRule.complexFilterConditions)
    );
}

function isColorEditRuleValid(editRule: ColorEditRule): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        editRule.color !== null &&
        getCompleteConditionsCount(editRule.complexFilterConditions) >= 1
    );
}

function isEdgeWidthEditRuleValid(editRule: EdgeWidthEditRule): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        isNotEmpty(editRule.propertyName) &&
        isNotNullish(editRule.scale)
    );
}

function isColorAndShapeEditRuleValid(
    editRule: ColorAndShapeEditRule,
): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        (editRule.color !== null || editRule.shape !== null) &&
        getCompleteConditionsCount(editRule.complexFilterConditions) >= 1
    );
}

function isSimpleLabelEditRuleValid(editRule: SimpleLabelEditRule): boolean {
    return isGenericEditRuleValid(editRule) && editRule.labelProperty !== null;
}

function isComposedLabelEditRuleValid(
    editRule: ComposedLabelEditRule,
): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        editRule.labelParts !== null &&
        editRule.labelParts.length > 0 &&
        editRule.labelParts.every(
            (p) => typeof p.property === "string" || p.useIndex !== undefined,
        )
    );
}

function isInvEditRuleValid(editRule: InvEditRule): boolean {
    return isGenericEditRuleValid(editRule);
}

export function isEditRuleValid(editRule: EditRule): boolean {
    switch (editRule.type) {
        case RuleType.COLOR_AND_SHAPE:
            return isColorAndShapeEditRuleValid(editRule);
        case RuleType.COLOR:
            return isColorEditRuleValid(editRule);
        case RuleType.LABEL:
            return isSimpleLabelRule(editRule)
                ? isSimpleLabelEditRuleValid(editRule)
                : isComposedLabelEditRuleValid(editRule);
        case RuleType.INVISIBILITY:
            return isInvEditRuleValid(editRule);
        case RuleType.EDGE_WIDTH:
            return isEdgeWidthEditRuleValid(editRule);
        default:
            return false;
    }
}

export function validateEditRule<T extends EditRule>(editRule: T): T {
    editRule.isValid = isEditRuleValid(editRule);
    return editRule;
}
