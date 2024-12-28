import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SidebarComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    // Simulação de carregamento de relatórios
    this.reports = [
      { 
        id: 1, 
        title: 'Relatório de Vendas', 
        date: new Date(), 
        status: 'Concluído' 
      },
      { 
        id: 2, 
        title: 'Relatório Financeiro', 
        date: new Date(), 
        status: 'Em Processamento' 
      }
    ];
  }

  generateReport() {
    // Lógica para gerar novo relatório
    console.log('Gerando relatório...');
  }
}
