import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { FirebaseService, Company } from './firebase.service';
import { GChatApiService, GChatContact, TagApiModel } from './gchat-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Contact {
  id: number;
  name: string;
  number: string;
  label: string;
  whatsappName: string;
  selected?: boolean;
}

export interface ContactFilter {
  searchTerm?: string;
  label?: string;
  minNameLength?: number;
  maxNameLength?: number;
}

export type ContactSortField = 'name' | 'number' | 'label' | 'whatsappName';
export type SortDirection = 'asc' | 'desc';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  // Estado privado dos contatos usando BehaviorSubject
  private contactsSubject = new BehaviorSubject<Contact[]>([]);
  private labelOptionsSubject = new BehaviorSubject<string[]>(['Todos']);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos para componentes consumirem
  contacts$ = this.contactsSubject.asObservable();
  labelOptions$ = this.labelOptionsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private firebaseService: FirebaseService,
    private gChatApiService: GChatApiService,
    private snackBar: MatSnackBar
  ) {}

  // Método para processar tags de um contato
  private processContactTags(contact: GChatContact): string {
    if (!contact.tags || contact.tags.length === 0) {
      return 'Sem etiqueta';
    }

    // Extrair descrições únicas das tags
    const tagDescriptions = contact.tags
      .map(tag => tag.Description)
      .filter(description => description && description.trim() !== '')
      .join(', ');

    return tagDescriptions || 'Sem etiqueta';
  }

  // Converter contatos do G-Chat para o formato interno
  private convertGChatContacts(gChatContacts: GChatContact[]): Contact[] {
    return gChatContacts.map((contact, index) => ({
      id: index + 1, // Convertendo para número
      name: contact.name || contact.nameFromWhatsApp || 'Sem nome',
      number: contact.number || '',
      label: this.processContactTags(contact),
      whatsappName: contact.nameFromWhatsApp || '',
      selected: false
    }));
  }

  // Buscar contatos do G-Chat
  searchGChat(companyToken: string): Observable<Contact[]> {
    // Ativar estado de carregamento
    this.loadingSubject.next(true);

    return this.gChatApiService.getContacts(companyToken).pipe(
      map((gChatContacts: GChatContact[]) => 
        this.convertGChatContacts(gChatContacts)
      ),
      tap((convertedContacts: Contact[]) => {
        // Atualizar lista de contatos
        this.contactsSubject.next(convertedContacts);
        
        // Atualizar opções de etiquetas
        this.updateLabelOptions(convertedContacts);
      }),
      catchError((error) => {
        // Tratar erro
        console.error('Erro ao buscar contatos do G-Chat:', error);
        
        // Limpar lista de contatos em caso de erro
        this.contactsSubject.next([]);
        
        // Propagar erro
        return throwError(() => new Error(
          error.error?.msg || 
          error.message || 
          'Erro desconhecido ao buscar contatos'
        ));
      }),
      tap(() => {
        // Desativar estado de carregamento
        this.loadingSubject.next(false);
      })
    );
  }

  // Atualizar opções de etiquetas
  private updateLabelOptions(contacts: Contact[]) {
    // Extrair descrições únicas de todas as etiquetas
    const uniqueLabels = ['Todos', ...new Set(
      contacts
        .map(contact => contact.label)
        .filter(label => label !== 'Sem etiqueta')
    )];

    this.labelOptionsSubject.next(uniqueLabels);
  }

  // Método avançado de filtragem e ordenação
  filterAndSortContacts(
    filter: ContactFilter = {}, 
    sortField?: ContactSortField, 
    sortDirection: SortDirection = 'asc'
  ): Contact[] {
    let contacts = this.contactsSubject.value;

    // Filtrar por termo de busca
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      contacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.number.toLowerCase().includes(searchTerm) ||
        contact.whatsappName.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por etiqueta
    if (filter.label && filter.label !== 'Todos') {
      contacts = contacts.filter(contact => 
        contact.label.toLowerCase() === filter.label?.toLowerCase()
      );
    }

    // Filtrar por comprimento do nome
    if (filter.minNameLength) {
      contacts = contacts.filter(contact => 
        contact.name.length >= filter.minNameLength!
      );
    }

    if (filter.maxNameLength) {
      contacts = contacts.filter(contact => 
        contact.name.length <= filter.maxNameLength!
      );
    }

    // Ordenar contatos
    if (sortField) {
      contacts.sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return contacts;
  }

  // Método para selecionar múltiplos contatos
  selectContacts(contacts: Contact[], selected: boolean) {
    const currentContacts = this.contactsSubject.value;
    
    const updatedContacts = currentContacts.map(contact => {
      // Se o contato está na lista de seleção, atualizar seu estado
      const matchedContact = contacts.find(c => c.id === contact.id);
      if (matchedContact) {
        return { ...contact, selected };
      }
      return contact;
    });

    this.contactsSubject.next(updatedContacts);
    return updatedContacts.filter(contact => contact.selected);
  }

  // Importar contatos (implementação futura)
  importContacts(): Observable<Contact[]> {
    // TODO: Implementar lógica de importação de contatos
    console.log('Importando contatos');
    return of([]);
  }

  // Exportar contatos
  exportContacts(contacts: Contact[], format: 'pdf' | 'csv' | 'excel' = 'csv'): Observable<boolean> {
    // Lógica de exportação baseada no formato
    switch (format) {
      case 'pdf':
        return this.exportToPDF(contacts);
      case 'csv':
        return this.exportToCSV(contacts);
      case 'excel':
        return this.exportToExcel(contacts);
      default:
        return of(false);
    }
  }

  private exportToPDF(contacts: Contact[]): Observable<boolean> {
    // Implementação da exportação para PDF
    return new Observable(observer => {
      try {
        // Usando jspdf para exportação em PDF
        import('jspdf').then(jsPDF => {
          import('jspdf-autotable').then(jspdfAutotable => {
            const doc = new jsPDF.default();
            const tableColumn = ['Nome', 'Número', 'Etiqueta', 'Nome WhatsApp'];
            const tableRows = contacts.map(contact => [
              contact.name, 
              contact.number, 
              contact.label, 
              contact.whatsappName
            ]);

            // @ts-ignore
            doc.autoTable(tableColumn, tableRows, { 
              startY: 20,
              styles: { fontSize: 10 },
              headStyles: { fillColor: [41, 128, 185] }
            });

            doc.save('contatos.pdf');
            observer.next(true);
            observer.complete();
          });
        });
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        observer.error(false);
      }
    });
  }

  private exportToCSV(contacts: Contact[]): Observable<boolean> {
    return new Observable(observer => {
      try {
        // Cabeçalho do CSV
        const headers = ['Nome', 'Número', 'Etiqueta', 'Nome WhatsApp'].join(',');
        
        // Linhas do CSV
        const csvContent = [
          headers,
          ...contacts.map(contact => 
            [contact.name, contact.number, contact.label, contact.whatsappName]
              .map(value => `"${value}"`)
              .join(',')
          )
        ].join('\n');

        // Criar blob e baixar arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'contatos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        observer.error(false);
      }
    });
  }

  private exportToExcel(contacts: Contact[]): Observable<boolean> {
    return new Observable(observer => {
      try {
        import('xlsx').then(XLSX => {
          // Preparar dados para planilha
          const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => ({
            Nome: contact.name,
            Número: contact.number,
            Etiqueta: contact.label,
            'Nome WhatsApp': contact.whatsappName
          })));

          // Criar workbook
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');

          // Salvar arquivo
          XLSX.writeFile(workbook, 'contatos.xlsx');

          observer.next(true);
          observer.complete();
        });
      } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        observer.error(false);
      }
    });
  }

  // Excluir contatos selecionados
  deleteSelectedContacts(selectedContacts: Contact[]): Observable<Contact[]> {
    const currentContacts = this.contactsSubject.value;
    const remainingContacts = currentContacts.filter(
      contact => !selectedContacts.includes(contact)
    );
    
    this.contactsSubject.next(remainingContacts);
    return of(remainingContacts);
  }

  // Filtrar contatos por etiqueta
  filterContactsByLabel(label: string): Contact[] {
    const allContacts = this.contactsSubject.value;
    
    if (label === 'Todos') return allContacts;
    
    return allContacts.filter(
      contact => contact.label.toLowerCase() === label.toLowerCase()
    );
  }
}
