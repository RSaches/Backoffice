import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { FirebaseService, Company } from './firebase.service';
import { GChatApiService, GChatContact, TagApiModel } from './gchat-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Contact {
  id: number;
  gChatId: string;  // ID original do G-Chat
  name: string;
  number: string;
  label: string;
  whatsappName: string;
  selected: boolean;
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
    return gChatContacts
      .map(contact => {
        if (!contact.id) {
          console.warn('Contato sem ID do G-Chat:', contact);
          return null;
        }
        
        return {
          id: Date.now(), // ID local temporário para a tabela
          gChatId: contact.id, // ID original do G-Chat (ex: "64d4b25af939a62141a76b0c")
          name: contact.nickName || contact.name || contact.nameFromWhatsApp || 'Sem nome',
          number: contact.number || '',
          label: this.processContactTags(contact),
          whatsappName: contact.nameFromWhatsApp || '',
          selected: false
        } as Contact;
      })
      .filter((contact): contact is Contact => contact !== null);
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
    // Extrair descrições únicas de todas as etiquetas, ordenando alfabeticamente
    const uniqueLabels = ['Todos', ...new Set(
      contacts
        .map(contact => contact.label)
        .filter(label => label !== 'Sem etiqueta')
        .sort((a, b) => a.localeCompare(b))
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
  selectContacts(contacts: Contact[], selected: boolean): Contact[] {
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

  // Método para excluir contatos
  deleteContacts(contacts: Contact[], companyToken: string): Observable<boolean> {
    if (!contacts.length || !companyToken) {
      this.snackBar.open('Nenhum contato selecionado para exclusão', 'Fechar', {
        duration: 3000
      });
      return of(false);
    }

    // Criar um array de observables para exclusão
    const deleteObservables = contacts.map(contact => {
      const contactId = contact.gChatId;
      
      return this.gChatApiService.deleteContact(companyToken, contactId).pipe(
        map(result => {
          if (result.notFound) {
            return { 
              id: contact.id, 
              success: true, 
              message: 'Contato já não existe' 
            };
          }
          return { 
            id: contact.id, 
            success: true 
          };
        }),
        catchError(error => {
          const errorMessage = error.message || `Erro ao excluir contato ${contact.id}`;
          console.error(errorMessage, error);
          
          return of({ 
            id: contact.id, 
            success: false, 
            message: errorMessage 
          });
        })
      );
    });

    return forkJoin(deleteObservables).pipe(
      map(results => {
        const successfulDeletes = results.filter(result => result.success);
        const failedDeletes = results.filter(result => !result.success);

        // Atualizar lista de contatos removendo os excluídos com sucesso
        if (successfulDeletes.length > 0) {
          const successfulIds = successfulDeletes.map(result => result.id);
          const remainingContacts = this.contactsSubject.value.filter(
            contact => !successfulIds.includes(contact.id)
          );
          this.contactsSubject.next(remainingContacts);
          
          const notFoundContacts = successfulDeletes.filter(result => result.message?.includes('não existe')).length;
          const deletedContacts = successfulDeletes.length - notFoundContacts;
          
          let message = '';
          if (deletedContacts > 0) {
            message += `${deletedContacts} contato(s) excluído(s) com sucesso. `;
          }
          if (notFoundContacts > 0) {
            message += `${notFoundContacts} contato(s) já haviam sido excluídos.`;
          }
          
          this.snackBar.open(message.trim(), 'Fechar', { duration: 3000 });
        }

        if (failedDeletes.length > 0) {
          console.warn(`Falha ao excluir ${failedDeletes.length} contato(s):`, 
            failedDeletes.map(f => `${f.id} (${f.message})`).join(', '));
        }

        return successfulDeletes.length > 0;
      }),
      catchError(error => {
        const errorMessage = error.message || 'Erro ao excluir contatos';
        console.error(errorMessage, error);
        
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 3000
        });
        
        return of(false);
      })
    );
  }

  // Filtrar contatos por etiqueta
  filterContactsByLabel(label: string): Contact[] {
    const allContacts = this.contactsSubject.value;
    
    if (label === 'Todos') return allContacts;
    
    return allContacts.filter(
      contact => contact.label.toLowerCase() === label.toLowerCase()
    );
  }

  deleteSelectedContacts(selectedContacts: Contact[]): Observable<boolean> {
    return of(false);
  }
}
