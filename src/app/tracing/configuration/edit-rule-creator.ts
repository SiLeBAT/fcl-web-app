import { COLOR_BFR_BLUE } from "./constants";
import {
    ColorAndShapeEditRule,
    ColorEditRule,
    EdgeWidthEditRule,
    EditRuleCore,
    InvEditRule,
    RuleType,
    SimpleLabelEditRule,
} from "./model";
import { EditRuleOfType } from "./shared";

export class EditRuleCreator {
    private static readonly DEFAULT_COLOR = COLOR_BFR_BLUE;
    private static ID_COUNTER = 0;
    private static ID_PREFIX = "R";

    private static getNextId(): string {
        return this.ID_PREFIX + this.ID_COUNTER++;
    }

    private static createEditRuleCore(): EditRuleCore {
        return {
            id: this.getNextId(),
            name: "",
            userDisabled: false,
            complexFilterConditions: [],
            isValid: false,
        };
    }

    static createColorAndShapeEditRule(): ColorAndShapeEditRule {
        return {
            ...this.createEditRuleCore(),
            type: RuleType.COLOR_AND_SHAPE,
            showInLegend: true,
            color: this.DEFAULT_COLOR,
            shape: null,
        };
    }

    static createColorEditRule(): ColorEditRule {
        return {
            ...this.createEditRuleCore(),
            type: RuleType.COLOR,
            showInLegend: true,
            color: this.DEFAULT_COLOR,
        };
    }

    static createSimpleLabelEditRule(): SimpleLabelEditRule {
        return {
            ...this.createEditRuleCore(),
            type: RuleType.LABEL,
            labelProperty: null,
        };
    }

    static createInvEditRule(): InvEditRule {
        return {
            ...this.createEditRuleCore(),
            type: RuleType.INVISIBILITY,
        };
    }

    static createEdgeWidthEditRule(): EdgeWidthEditRule {
        return {
            ...this.createEditRuleCore(),
            type: RuleType.EDGE_WIDTH,
            minimumZero: false,
            propertyName: null,
            scale: null,
        };
    }

    static createNewEditRule<T extends RuleType, R extends EditRuleOfType<T>>(
        ruleType: RuleType,
    ): R {
        switch (ruleType) {
            case RuleType.COLOR_AND_SHAPE:
                return this.createColorAndShapeEditRule() as R;
            case RuleType.COLOR:
                return this.createColorEditRule() as R;
            case RuleType.LABEL:
                return this.createSimpleLabelEditRule() as R;
            case RuleType.INVISIBILITY:
                return this.createInvEditRule() as R;
            case RuleType.EDGE_WIDTH:
                return this.createEdgeWidthEditRule() as R;
            default:
                throw new Error(
                    `Cannot create edit rule for rule type '${RuleType[ruleType]} (Rule type is not supported yet)'.`,
                );
        }
    }
}
