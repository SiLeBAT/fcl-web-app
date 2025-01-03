import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
} from "@angular/core";
import { OperationType, TableColumn } from "@app/tracing/data.model";
import { ComplexFilterCondition, PropToValuesMap } from "./configuration.model";
import { EditRule } from "./model";
import { isEditRuleValid, validateEditRule } from "./edit-rule-validaton";

@Component({ template: "" })
export abstract class AbstractRuleEditViewComponent<T extends EditRule>
    implements OnChanges
{
    private static readonly ENABLED_APPLY_TOOLTIP = "Apply Highlighting Rule";
    private static readonly ENABLED_OK_TOOLTIP =
        "Apply Highlighting Rule and close dialogue";

    @Input() rule: T | null = null;
    @Input() favouriteProperties: TableColumn[] = [];
    @Input() otherProperties: TableColumn[] = [];
    @Input() propToValuesMap: PropToValuesMap = {};

    @Output() applyRule = new EventEmitter<T>();
    @Output() cancelEdit = new EventEmitter<void>();
    @Output() okRule = new EventEmitter<T>();
    @Output() ruleChange = new EventEmitter<T>();
    @Output() addSelection = new EventEmitter<T>();
    @Output() removeSelection = new EventEmitter<T>();

    availableOperatorTypes: OperationType[] = [
        OperationType.EQUAL,
        OperationType.GREATER,
        OperationType.NOT_EQUAL,
        OperationType.LESS,
        OperationType.REGEX_EQUAL,
        OperationType.REGEX_NOT_EQUAL,
        OperationType.REGEX_EQUAL_IGNORE_CASE,
        OperationType.REGEX_NOT_EQUAL_IGNORE_CASE,
    ];

    get complexFilterConditions(): ComplexFilterCondition[] {
        return this.rule?.complexFilterConditions ?? [];
    }

    get actionButtonDisabled(): boolean {
        return !this.isRuleValid || !this.isEditViewComplete;
    }

    get isEditViewComplete(): boolean {
        return true;
    }

    get isRuleValid(): boolean {
        return this.rule?.isValid ?? false;
    }

    abstract get disabledActionToolTip(): string;

    get enabledApplyToolTip(): string {
        return AbstractRuleEditViewComponent.ENABLED_APPLY_TOOLTIP;
    }

    get enabledOkToolTip(): string {
        return AbstractRuleEditViewComponent.ENABLED_OK_TOOLTIP;
    }

    get applyTooltip(): string {
        return this.actionButtonDisabled
            ? this.disabledActionToolTip
            : this.enabledApplyToolTip;
    }

    get okTooltip(): string {
        return this.actionButtonDisabled
            ? this.disabledActionToolTip
            : this.enabledOkToolTip;
    }

    get ruleName(): string {
        return this.rule?.name ?? "";
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rule !== undefined && this.rule) {
            this.rule = {
                ...this.rule,
                isValid: isEditRuleValid(this.rule),
            };
        }
    }

    onRuleNameChange(ruleName: string): void {
        this.changeRule({ name: ruleName });
    }

    onComplexFilterChange(
        complexFilterConditions: ComplexFilterCondition[],
    ): void {
        this.changeRule({ complexFilterConditions: complexFilterConditions });
    }

    onAddSelection(): void {
        if (this.rule) {
            this.addSelection.emit(this.rule);
        }
    }

    onRemoveSelection(): void {
        if (this.rule) {
            this.removeSelection.emit(this.rule);
        }
    }

    onApplyRule(): void {
        if (this.rule) {
            this.applyRule.emit(this.rule);
        }
    }

    onCancelRule(): void {
        this.cancelEdit.emit();
    }

    onOkRule(): void {
        if (this.rule) {
            this.okRule.emit(this.rule);
        }
    }

    protected changeRule(ruleChange: Partial<T | EditRule>): void {
        this.rule = {
            ...this.rule!,
            ...ruleChange,
        };
        validateEditRule(this.rule);
    }
}
