import {
    ChangeDetectionStrategy,
    Component,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { Color, NodeShapeType } from "@app/tracing/data.model";
import { ColorAndShapeEditRule } from "../model";
import { AbstractRuleEditViewComponent } from "../abstract-rule-edit-view";
import { COLOR_BFR_BLUE } from "../constants";
import { isNullish } from "@app/tracing/util/non-ui-utils";

@Component({
    selector: "fcl-colors-and-shapes-edit-view",
    templateUrl: "./colors-and-shapes-edit-view.component.html",
    styleUrls: ["./colors-and-shapes-edit-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorsAndShapesEditViewComponent
    extends AbstractRuleEditViewComponent<ColorAndShapeEditRule>
    implements OnChanges
{
    private static readonly DEFAULT_COLOR = COLOR_BFR_BLUE;
    private static readonly DISABLED_ACTION_TOOLTIP =
        "Please enter name, select colour and/or shape as well as conditions";

    private useShape_ = false;
    private lastActiveColor: Color =
        ColorsAndShapesEditViewComponent.DEFAULT_COLOR;
    private lastActiveShape: NodeShapeType | null = null;

    get useShape(): boolean {
        return this.useShape_;
    }

    get useColor(): boolean {
        return this.color !== null;
    }

    get color(): Color | null {
        return this.rule?.color ?? null;
    }

    get disabledActionToolTip(): string {
        return ColorsAndShapesEditViewComponent.DISABLED_ACTION_TOOLTIP;
    }

    get shape(): NodeShapeType | null {
        return this.rule?.shape ?? null;
    }

    get isEditViewComplete(): boolean {
        const shapeIsSet = !isNullish(this.rule?.shape);
        return this.useShape === shapeIsSet && super.isEditViewComplete;
    }

    constructor() {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rule !== undefined && changes.rule.isFirstChange()) {
            const shapeIsSet = !isNullish(this.rule?.shape);
            this.useShape_ = shapeIsSet;
        }
        super.ngOnChanges(changes);
    }

    onShapeChange(shapeType: NodeShapeType | null): void {
        this.setShape(shapeType);
    }

    onUseColorChange(useColor: boolean): void {
        this.setColor(useColor ? this.lastActiveColor : null);
    }

    onColorChange(color: Color | null): void {
        this.changeRule({ color: color });
        if (color !== null) {
            this.lastActiveColor = color;
        }
    }

    onUseShapeChange(useShape: boolean): void {
        this.useShape_ = useShape;
        this.setShape(useShape ? this.lastActiveShape : null);
    }

    private setShape(shape: NodeShapeType | null): void {
        this.changeRule({ shape: shape });
        if (shape !== null) {
            this.lastActiveShape = shape;
            this.useShape_ = true;
        }
    }

    private setColor(color: Color | null): void {
        this.changeRule({ color: color });
        if (color !== null) {
            this.lastActiveColor = color;
        }
    }
}
