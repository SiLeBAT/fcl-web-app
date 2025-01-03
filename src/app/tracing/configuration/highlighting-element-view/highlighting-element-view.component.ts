import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
} from "@angular/core";
import { TableColumn } from "@app/tracing/data.model";
import {
    HighlightingRuleDeleteRequestData,
    PropToValuesMap,
} from "../configuration.model";
import { EditRule, RuleId, RuleListItem, RuleType } from "../model";
import { removeNullishPick } from "@app/tracing/util/non-ui-utils";

@Component({ template: "" })
export class HighlightingElementViewComponent<T extends EditRule>
    implements OnChanges
{
    RuleType = RuleType;

    @Input() favouriteProperties: TableColumn[] = [];
    @Input() otherProperties: TableColumn[] = [];
    @Input() propToValuesMap: PropToValuesMap = {};
    @Input() editRules: T[] = [];
    @Input() ruleListItems: RuleListItem[] = [];

    @Output() ruleOrderChange = new EventEmitter<RuleId[]>();
    @Output() toggleRuleIsDisabled = new EventEmitter<RuleId>();
    @Output() toggleShowRuleInLegend = new EventEmitter<RuleId>();
    @Output() deleteRule =
        new EventEmitter<HighlightingRuleDeleteRequestData>();

    @Output() newRule = new EventEmitter<RuleType>();
    @Output() startEdit = new EventEmitter<RuleId>();
    @Output() cancelEdit = new EventEmitter<RuleId>();
    @Output() applyEdit = new EventEmitter<EditRule>();
    @Output() okEdit = new EventEmitter<T>();

    @Output() addSelectionToRuleConditions = new EventEmitter<T>();
    @Output() removeSelectionFromRuleConditions = new EventEmitter<T>();

    private openState_: Record<string, boolean> = {};
    private typeToListItemsMap_: Record<RuleType, RuleListItem[]> =
        {} as Record<RuleType, RuleListItem[]>;
    private typeToEditRuleMap_: Record<RuleType, T> = {} as Record<RuleType, T>;
    private emptyArray = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.ruleListItems !== undefined) {
            this.updateTypeToListItemsMap();
        }
        if (changes.editRules !== undefined) {
            this.updateTypeToEditRuleMap();
        }
    }

    onDeleteRule(
        deleteRuleRequestData: HighlightingRuleDeleteRequestData,
    ): void {
        this.deleteRule.emit(deleteRuleRequestData);
    }

    onApplyEdit(editRule: T): void {
        this.applyEdit.emit(editRule);
    }

    onCancelEdit(ruleId: RuleId): void {
        this.cancelEdit.emit(ruleId);
    }

    onOkEdit(editRule: T): void {
        this.okEdit.emit(editRule);
    }

    onToggleRuleIsDisabled(ruleId: RuleId): void {
        this.toggleRuleIsDisabled.emit(ruleId);
    }

    onToggleShowRuleInLegend(ruleId: RuleId): void {
        this.toggleShowRuleInLegend.emit(ruleId);
    }

    onRuleOrderChange(ruleIds: RuleId[]): void {
        this.ruleOrderChange.emit(ruleIds);
    }

    onNewRule(ruleType: RuleType): void {
        this.newRule.emit(ruleType);
    }

    onStartEdit(ruleId: RuleId): void {
        this.startEdit.emit(ruleId);
    }

    onAddSelectionToRuleConditions(editRule: T): void {
        this.addSelectionToRuleConditions.emit(editRule);
    }

    onRemoveSelectionFromRuleConditions(editRule: T): void {
        this.removeSelectionFromRuleConditions.emit(editRule);
    }

    setOpenState(ruleType: RuleType, openState: boolean): void {
        this.openState_[ruleType] = openState;
    }

    getOpenState(ruleType: RuleType): boolean {
        const openState = this.openState_[ruleType];
        return openState ?? false;
    }

    getListItemsOfType(ruleType: RuleType): RuleListItem[] {
        return this.typeToListItemsMap_[ruleType] || this.emptyArray;
    }

    getEditRuleOfType(ruleType: RuleType): T | null {
        return this.typeToEditRuleMap_[ruleType] || null;
    }

    private updateTypeToListItemsMap(): void {
        this.typeToListItemsMap_ = {} as Record<RuleType, RuleListItem[]>;
        const ruleListItemsWithRuleType = removeNullishPick(
            this.ruleListItems,
            "ruleType",
        );
        ruleListItemsWithRuleType.forEach((item) => {
            const list = this.typeToListItemsMap_[item.ruleType!];
            if (list === undefined) {
                this.typeToListItemsMap_[item.ruleType] = [item];
            } else {
                list.push(item);
            }
        });
    }

    private updateTypeToEditRuleMap(): void {
        this.typeToEditRuleMap_ = {} as Record<RuleType, T>;
        this.editRules.forEach((rule) => {
            this.typeToEditRuleMap_[rule.type] = rule;
        });
    }
}
