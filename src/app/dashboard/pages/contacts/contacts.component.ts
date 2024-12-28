import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FirebaseService, Company } from '../../../core/services/firebase.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { 
  ContactsService, 
  Contact, 
  ContactFilter, 
  ContactSortField, 
  SortDirection 
} from '../../../core/services/contacts.service';
import { Subscription } from 'rxjs';
import { ExportDialogComponent, ExportFormat } from './export-dialog.component';

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
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {
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

  // ViewChild para os campos de input
  @ViewChild('labelSelect') labelSelect!: MatSelect;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Opções de etiquetas dinâmicas
  labelOptions: string[] = ['Todos'];

  // Opções de ordenação
  sortFields: { value: ContactSortField; label: string }[] = [
    { value: 'name', label: 'Nome' },
    { value: 'number', label: 'Número' },
    { value: 'label', label: 'Etiqueta' },
    { value: 'whatsappName', label: 'Nome WhatsApp' }
  ];

  // Estado de filtro e ordenação
  currentFilter: ContactFilter = {};
  currentSortField?: ContactSortField;
  currentSortDirection: SortDirection = 'asc';

  // Seleção de contatos
  selectedContacts: Contact[] = [];
  isAllSelected = false;

  companies: Company[] = [];
  selectedCompany: string | null = null;
  selectedCompanyToken: string | null = null;

  // Variável para controlar o estado de carregamento
  isLoading = false;

  // Subscriptions para gerenciar observables
  private subscriptions: Subscription[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private contactsService: ContactsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.setupContactsSubscriptions();
  }

  ngOnDestroy(): void {
    // Desinscrever de todos os observables
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit() {
    // Configurar paginador
    this.dataSource.paginator = this.paginator;
    
    // Definir 15 itens por página
    this.paginator.pageSize = 15;
  }

  // Método para obter o label de ordenação atual
  getSortLabel(): string {
    const currentSort = this.sortFields.find(f => f.value === this.currentSortField);
    return currentSort ? `por ${currentSort.label}` : '';
  }

  private setupContactsSubscriptions() {
    // Inscrever para lista de contatos
    this.subscriptions.push(
      this.contactsService.contacts$.subscribe(contacts => {
        this.dataSource.data = contacts;
      })
    );

    // Inscrever para opções de etiquetas
    this.subscriptions.push(
      this.contactsService.labelOptions$.subscribe(labels => {
        this.labelOptions = labels;
      })
    );

    // Inscrever para estado de carregamento
    this.subscriptions.push(
      this.contactsService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  // Métodos de seleção de contatos
  toggleAllSelection() {
    this.isAllSelected = !this.isAllSelected;
    const contactsToSelect = this.dataSource.filteredData;
    
    this.selectedContacts = this.contactsService.selectContacts(
      contactsToSelect, 
      this.isAllSelected
    );
  }

  toggleContactSelection(contact: Contact) {
    const isCurrentlySelected = this.selectedContacts.some(c => c.id === contact.id);
    
    this.selectedContacts = this.contactsService.selectContacts(
      [contact], 
      !isCurrentlySelected
    );

    // Atualizar estado de seleção total
    this.isAllSelected = this.selectedContacts.length === this.dataSource.filteredData.length;
  }

  // Métodos de filtragem e ordenação
  applyFilter(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement?.value || '';
    
    this.currentFilter = { 
      ...this.currentFilter, 
      searchTerm 
    };
    this.updateFilteredContacts();
  }

  filterByLabel(label: string) {
    this.currentFilter = { 
      ...this.currentFilter, 
      label 
    };
    this.updateFilteredContacts();
  }

  sortContacts(field: ContactSortField) {
    // Alternar direção se o mesmo campo for selecionado
    if (this.currentSortField === field) {
      this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortField = field;
      this.currentSortDirection = 'asc';
    }
    
    this.updateFilteredContacts();
  }

  private updateFilteredContacts() {
    const filteredContacts = this.contactsService.filterAndSortContacts(
      this.currentFilter, 
      this.currentSortField, 
      this.currentSortDirection
    );

    this.dataSource.data = filteredContacts;

    // Atualizar seleção após filtragem
    this.isAllSelected = false;
    this.selectedContacts = [];
  }

  // Métodos de ação
  searchGChat() {
    if (!this.selectedCompany || !this.selectedCompanyToken) {
      this.snackBar.open('Selecione uma empresa primeiro', 'Fechar', { duration: 3000 });
      return;
    }

    // Limpar campos de filtro e lista
    this.currentFilter = {};
    this.currentSortField = undefined;
    this.selectedContacts = [];
    this.isAllSelected = false;
    
    // Limpar campos de input
    if (this.labelSelect) {
      this.labelSelect.value = null;
    }
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    
    // Limpar lista de contatos
    this.dataSource.data = [];

    this.subscriptions.push(
      this.contactsService.searchGChat(this.selectedCompanyToken).subscribe({
        next: (contacts) => {
          // Atualizar lista de contatos após a busca
          this.dataSource.data = contacts;
        },
        error: (error) => {
          this.snackBar.open(error.message, 'Fechar', { 
            duration: 5000,
            panelClass: ['error-snackbar'] 
          });
        }
      })
    );
  }

  importContacts() {
    this.subscriptions.push(
      this.contactsService.importContacts().subscribe({
        next: () => {
          this.snackBar.open('Contatos importados com sucesso', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Erro ao importar contatos', 'Fechar', { duration: 3000 });
        }
      })
    );
  }

  exportContacts() {
    // Abrir diálogo de seleção de formato
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '300px'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((format: ExportFormat | null) => {
        if (format) {
          this.contactsService.exportContacts(this.dataSource.filteredData, format)
            .subscribe({
              next: () => {
                this.snackBar.open('Contatos exportados com sucesso', 'Fechar', { duration: 3000 });
              },
              error: () => {
                this.snackBar.open('Erro ao exportar contatos', 'Fechar', { duration: 3000 });
              }
            });
        }
      })
    );
  }

  deleteSelectedContacts() {
    this.subscriptions.push(
      this.contactsService.deleteSelectedContacts(this.selectedContacts).subscribe({
        next: () => {
          this.selectedContacts = [];
          this.isAllSelected = false;
          this.snackBar.open('Contatos excluídos com sucesso', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Erro ao excluir contatos', 'Fechar', { duration: 3000 });
        }
      })
    );
  }

  loadCompanies() {
    this.firebaseService.getCompanies().subscribe(
      (companies) => {
        this.companies = companies;
      },
      (error) => {
        this.snackBar.open('Erro ao carregar empresas', 'Fechar', { duration: 3000 });
      }
    );
  }

  onCompanySelect(companyId: string) {
    const selectedCompany = this.companies.find(company => company.id === companyId);
    if (selectedCompany) {
      this.selectedCompanyToken = selectedCompany.token;
    }
  }
}
