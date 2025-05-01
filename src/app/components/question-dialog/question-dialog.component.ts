import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


export class QuestionOptions {
  id: string;
  text: string;
  color: string = 'primary';
  tabIndex: number = 0;
}

export interface QuestionData {
  title: string;
  message: string;
  options: QuestionOptions[];
}


@Component({
  selector: 'app-question-dialog',
  templateUrl: 'question-dialog.component.html',
})
export class QuestionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<QuestionDialogComponent, string>);
  
  readonly title = inject(MAT_DIALOG_DATA).title;
  readonly message = inject(MAT_DIALOG_DATA).message;
  readonly options = inject(MAT_DIALOG_DATA).options;

  onOptionClick(option: any): void {
    this.dialogRef.close(option);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
