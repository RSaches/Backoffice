import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

export interface Contact {
  id: number;
  name: string;
  number: string;
  label: string;
  whatsappName: string;
  selected?: boolean;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    SidebarComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  // Colunas que serão exibidas na tabela
  displayedColumns: string[] = [
    'select', 
    'name', 
    'number', 
    'label', 
    'whatsappName'
  ];

  // Lista completa de contatos
  allContacts: Contact[] = [];

  // Contatos filtrados para exibição
  filteredContacts: Contact[] = [];

  // Controle de paginação
  pageSize = 25;
  pageIndex = 0;

  // Filtro de busca
  searchTerm = '';

  // Opções de etiquetas
  labelOptions = [
    'Família', 
    'Trabalho', 
    'Amigos', 
    'Outros'
  ];

  // Seleção de contatos
  selectedContacts: Contact[] = [];

  constructor() {}

  ngOnInit(): void {
    this.generateMockContacts();
    this.applyFilter();
  }

  // Gerar contatos mockados
  generateMockContacts() {
    for (let i = 1; i <= 100; i++) {
      this.allContacts.push({
        id: i,
        name: `Contato ${i}`,
        number: `+55 (11) 9${this.padNumber(i, 8)}`,
        label: this.labelOptions[i % this.labelOptions.length],
        whatsappName: `Usuário WhatsApp ${i}`
      });
    }
  }

  // Ajudar a gerar números de telefone
  padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }

  // Aplicar filtro de busca
  applyFilter() {
    const lowerSearchTerm = this.searchTerm.toLowerCase();
    this.filteredContacts = this.allContacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerSearchTerm) ||
      contact.number.includes(lowerSearchTerm) ||
      contact.whatsappName.toLowerCase().includes(lowerSearchTerm)
    );
  }

  // Métodos de ação dos botões
  searchGChat() {
    console.log('Buscando no G-Chat');
  }

  importContacts() {
    console.log('Importando contatos');
  }

  exportContacts() {
    console.log('Exportando contatos');
  }

  deleteSelectedContacts() {
    this.allContacts = this.allContacts.filter(
      contact => !this.selectedContacts.includes(contact)
    );
    this.selectedContacts = [];
    this.applyFilter();
  }

  // Controle de seleção de contatos
  isAllSelected() {
    return this.selectedContacts.length === this.filteredContacts.length;
  }

  toggleAllSelection() {
    if (this.isAllSelected()) {
      this.selectedContacts = [];
    } else {
      this.selectedContacts = [...this.filteredContacts];
    }
  }

  toggleContactSelection(contact: Contact) {
    const index = this.selectedContacts.indexOf(contact);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
  }
}
