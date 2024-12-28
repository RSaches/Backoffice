import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FirebaseService, Company } from '../../../core/services/firebase.service';
import { GChatApiService, GChatContact } from '../../../core/services/gchat-api.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatSnackBarModule,
    RouterModule,
    SidebarComponent,
    MatProgressSpinnerModule
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

  // DataSource para a tabela com paginação
  dataSource = new MatTableDataSource<Contact>([]);

  // ViewChild para o paginador
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Opções de etiquetas dinâmicas
  labelOptions: string[] = ['Todos'];

  // Termo de busca
  searchTerm: string = '';

  // Seleção de contatos
  selectedContacts: Contact[] = [];

  companies: Company[] = [];
  selectedCompany: string | null = null;
  selectedCompanyToken: string | null = null;

  // Variável para controlar o estado de carregamento
  isLoading = false;

  constructor(
    private firebaseService: FirebaseService,
    private gChatApiService: GChatApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  ngAfterViewInit() {
    // Configurar paginador
    this.dataSource.paginator = this.paginator;
    
    // Definir 15 itens por página
    this.paginator.pageSize = 15;

    // Configurar filtro personalizado para etiquetas
    this.dataSource.filterPredicate = (data: Contact, filter: string) => {
      // Se for 'Todos', mostrar todos os contatos
      if (filter === '') return true;
      
      // Comparar etiqueta exatamente, ignorando case
      return data.label.toLowerCase() === filter.toLowerCase();
    };
  }

  // Métodos de ação dos botões
  searchGChat() {
    if (!this.selectedCompany || !this.selectedCompanyToken) {
      this.snackBar.open('Selecione uma empresa primeiro', 'Fechar', { duration: 3000 });
      return;
    }

    // Limpar lista de contatos antes de buscar
    this.dataSource.data = [];

    // Ativar loading
    this.isLoading = true;

    // Buscar contatos na API do G-Chat
    this.gChatApiService.getContacts(this.selectedCompanyToken).subscribe({
      next: (gChatContacts: GChatContact[]) => {
        // Converter contatos do G-Chat para o formato da tabela
        const convertedContacts: Contact[] = gChatContacts.map((contact, index) => ({
          id: index + 1,
          name: contact.name || contact.nameFromWhatsApp || 'Contato sem nome',
          number: contact.number || 'Número não disponível',
          label: contact.tags && contact.tags.length > 0 
            ? contact.tags[0].name 
            : 'Sem etiqueta',
          whatsappName: contact.nameFromWhatsApp || contact.name || 'Contato sem nome'
        }));

        // Atualizar a tabela com os contatos
        this.dataSource.data = convertedContacts;

        // Atualizar opções de etiquetas dinamicamente
        this.updateLabelOptions(convertedContacts);

        // Atualizar paginação
        this.updatePagination();

        // Mostrar mensagem de sucesso
        this.snackBar.open(`${convertedContacts.length} contatos carregados`, 'Fechar', { duration: 3000 });
      },
      error: (error) => {
        // Tratar erro na busca de contatos
        console.error('Erro ao buscar contatos do G-Chat:', error);
        
        // Mensagem de erro mais detalhada
        const errorMessage = error.error?.msg || 
                             error.message || 
                             'Erro desconhecido ao buscar contatos';
        
        this.snackBar.open(errorMessage, 'Fechar', { 
          duration: 5000,
          panelClass: ['error-snackbar'] 
        });
      },
      complete: () => {
        // Desativar loading quando a requisição terminar (com sucesso ou erro)
        this.isLoading = false;
      }
    });
  }

  importContacts() {
    console.log('Importando contatos');
  }

  exportContacts() {
    console.log('Exportando contatos');
  }

  deleteSelectedContacts() {
    this.dataSource.data = this.dataSource.data.filter(
      contact => !this.selectedContacts.includes(contact)
    );
    this.selectedContacts = [];
  }

  toggleContactSelection(contact: Contact) {
    contact.selected = !contact.selected;
    
    if (contact.selected) {
      this.selectedContacts.push(contact);
    } else {
      const index = this.selectedContacts.findIndex(c => c.id === contact.id);
      if (index !== -1) {
        this.selectedContacts.splice(index, 1);
      }
    }
  }

  loadCompanies() {
    this.firebaseService.getCompanies().subscribe(
      (companies) => {
        this.companies = companies;
      },
      (error) => {
        console.error('Erro ao carregar empresas:', error);
      }
    );
  }

  onCompanySelect(companyId: string) {
    // Encontrar o token da empresa selecionada
    const selectedCompany = this.companies.find(company => company.id === companyId);
    this.selectedCompanyToken = selectedCompany ? selectedCompany.token : null;
  }

  // Método para atualizar as opções de etiquetas
  updateLabelOptions(contacts: Contact[]) {
    // Resetar para 'Todos'
    this.labelOptions = ['Todos'];

    // Extrair etiquetas únicas
    const uniqueLabels = new Set(
      contacts
        .map(contact => contact.label)
        .filter(label => label !== 'Sem etiqueta')
    );

    // Adicionar etiquetas únicas
    uniqueLabels.forEach(label => {
      if (label) {
        this.labelOptions.push(label);
      }
    });

    // Adicionar 'Sem etiqueta' no final
    this.labelOptions.push('Sem etiqueta');

    console.log('Etiquetas disponíveis:', this.labelOptions);
  }

  // Método para filtrar por etiqueta
  filterByLabel(label: string) {
    console.log('Filtrando por etiqueta:', label);

    if (label === 'Todos') {
      // Limpar filtro
      this.dataSource.filter = '';
    } else {
      // Aplicar filtro específico
      this.dataSource.filter = label.trim().toLowerCase();
    }

    // Garantir que a paginação seja recalculada
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // Log para verificar filtragem
    console.log('Contatos filtrados:', 
      this.dataSource.filteredData.length, 
      'de', 
      this.dataSource.data.length
    );
  }

  // Método para atualizar a paginação
  updatePagination() {
    if (this.dataSource.paginator) {
      this.dataSource.paginator.length = this.dataSource.filteredData.length;
      this.dataSource.paginator.pageIndex = 0;
    }
  }

  // Método para filtrar contatos
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
