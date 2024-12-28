import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export type ExportFormat = 'pdf' | 'csv' | 'excel';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatRadioModule, 
    FormsModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Selecione o Formato de Exportação</h2>
    <mat-dialog-content>
      <mat-radio-group [(ngModel)]="selectedFormat">
        <mat-radio-button value="pdf">PDF</mat-radio-button>
        <mat-radio-button value="csv">CSV</mat-radio-button>
        <mat-radio-button value="excel">Excel</mat-radio-button>
      </mat-radio-group>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onConfirm()" 
        [disabled]="!selectedFormat">
        Exportar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }
  `]
})
export class ExportDialogComponent {
  selectedFormat: ExportFormat | null = null;

  constructor(private dialogRef: MatDialogRef<ExportDialogComponent>) {}

  onConfirm() {
    if (this.selectedFormat) {
      this.dialogRef.close(this.selectedFormat);
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
