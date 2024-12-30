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
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';

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
    'whatsappName',
    'actions',
    'gChatId'  // Coluna oculta para o ID do G-Chat
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
    
    // Definir opções de tamanho de página: 5, 15, 25, 50, 75, 100, 125
    this.paginator.pageSizeOptions = [5, 15, 25, 50, 75, 100, 125];
    
    // Definir tamanho inicial de página para 5
    this.paginator.pageSize = 5;
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

  // Verifica se um contato está selecionado
  isSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.gChatId === contact.gChatId);
  }

  // Métodos de seleção de contatos
  toggleAllSelection() {
    const contacts = this.dataSource.filteredData;
    this.selectedContacts = this.isAllSelected ? contacts : [];
  }

  toggleContactSelection(contact: Contact) {
    const index = this.selectedContacts.findIndex(c => c.gChatId === contact.gChatId);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
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

    // Mostrar pop-up animado com quantidade de contatos
    const contactCount = filteredContacts.length;
    const message = contactCount === 1 
      ? '1 contato encontrado' 
      : `${contactCount} contatos encontrados`;

    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['contact-count-snackbar']
    });
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

          // Mostrar pop-up animado com quantidade de contatos
          const contactCount = contacts.length;
          const message = contactCount === 1 
            ? '1 contato encontrado' 
            : `${contactCount} contatos encontrados`;

          this.snackBar.open(message, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['contact-count-snackbar']
          });
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

  deleteSelectedContacts(contacts?: Contact[]) {
    if (!this.selectedCompanyToken) {
      this.snackBar.open('Selecione uma empresa primeiro', 'Fechar', { duration: 3000 });
      return;
    }

    const contactsToDelete = contacts || this.selectedContacts;

    if (contactsToDelete.length === 0) {
      this.snackBar.open('Nenhum contato selecionado', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar IDs dos contatos selecionados
    const validContacts = contactsToDelete.filter(contact => {
      if (!contact.gChatId) {
        console.warn('Contato sem ID do G-Chat:', contact);
        return false;
      }
      return true;
    });

    if (validContacts.length === 0) {
      this.snackBar.open('Nenhum contato válido para exclusão', 'Fechar', { duration: 3000 });
      return;
    }

    if (validContacts.length !== contactsToDelete.length) {
      console.warn(`${contactsToDelete.length - validContacts.length} contatos inválidos foram ignorados`);
    }

    // Confirmar exclusão
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir ${validContacts.length} contato(s)?`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isLoading = true;
        this.contactsService.deleteContacts(
          validContacts, 
          this.selectedCompanyToken || ''
        ).subscribe({
          next: (success: boolean) => {
            this.isLoading = false;
            // Limpar seleção após a exclusão, independente do resultado
            if (contacts) {
              // Se foi uma exclusão individual, apenas remover o contato da seleção
              this.selectedContacts = this.selectedContacts.filter(
                c => !validContacts.some(vc => vc.gChatId === c.gChatId)
              );
            } else {
              // Se foi uma exclusão em lote, limpar toda a seleção
              this.selectedContacts = [];
              this.isAllSelected = false;
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            console.error('Erro ao excluir contatos:', error);
          }
        });
      }
    });
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

  // Método para editar contato
  editContact(contact: any) {
    // TODO: Implementar lógica de edição de contato
    console.log('Editar contato:', contact);
  }
}
