import {Component, Inject} from '@angular/core';
import {MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

export interface DialogSelectData {
  title: string;
  options: { value: string, viewValue: string, selected: boolean }[];
}

@Component({
  selector: 'app-dialog-select',
  templateUrl: './dialog-select.component.html',
  styleUrls: ['./dialog-select.component.css']
})
export class DialogSelectComponent {

  options: any[];

  constructor(public dialogRef: MdDialogRef<DialogSelectComponent>, @Inject(MD_DIALOG_DATA) public data: DialogSelectData) {
    this.options = JSON.parse(JSON.stringify(data.options));
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    this.dialogRef.close(this.options.filter(o => o.selected).map(o => o.value));
  }

}
