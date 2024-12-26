import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar.component';
import { FirebaseService, Company } from '../../../core/services/firebase.service';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatIconModule, 
    RouterModule,
    NgxMaskDirective,
    NgxMaskPipe,
    SidebarComponent,
    MatSnackBarModule
  ],
  providers: [provideNgxMask()],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeTab: 'companies' | 'users' | 'settings' = 'companies';

  company: Company = {
    cnpj: '',
    email: '',
    idGChat: '',
    nomeFantasia: '',
    nomeGChat: '',
    telefone: '',
    token: ''
  };

  companiesList: Company[] = [];
  private companiesSubscription?: Subscription;
  isLoading = false;
  errorMessage = '';

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  ngOnDestroy() {
    if (this.companiesSubscription) {
      this.companiesSubscription.unsubscribe();
    }
  }

  loadCompanies() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Iniciando carregamento de empresas...');

    this.companiesSubscription = this.firebaseService.getCompanies()
      .subscribe({
        next: (companies) => {
          console.log('Empresas recebidas no componente:', companies);
          this.companiesList = companies;
          this.isLoading = false;
          
          if (companies.length === 0) {
            this.snackBar.open('Nenhuma empresa encontrada.', 'Fechar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Erro detalhado ao carregar empresas:', error);
          this.isLoading = false;
          this.errorMessage = 'Erro ao carregar empresas. Verifique sua autenticação e conexão.';
          this.snackBar.open(this.errorMessage, 'Fechar', { 
            duration: 5000 
          });
        },
        complete: () => {
          console.log('Carregamento de empresas concluído');
        }
      });
  }

  setActiveTab(tab: 'companies' | 'users' | 'settings') {
    this.activeTab = tab;
  }

  buscarToken() {
    // Lógica para buscar o token
    console.log('Buscando token...');
    // Aqui você pode implementar a chamada para um serviço que busca o token
  }

  salvarEmpresa() {
    // Validar campos obrigatórios
    if (!this.validarCamposEmpresa()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Adicionar a empresa ao Firestore
    this.firebaseService.addCompany({
      cnpj: this.company.cnpj,
      email: this.company.email,
      idGChat: this.company.idGChat,
      nomeFantasia: this.company.nomeFantasia,
      nomeGChat: this.company.nomeGChat,
      telefone: this.company.telefone,
      token: this.company.token
    })
    .then(() => {
      this.isLoading = false;
      this.snackBar.open('Empresa salva com sucesso!', 'Fechar', { duration: 3000 });
      
      // Recarregar a lista de empresas após salvar
      this.loadCompanies();
      
      // Limpar o formulário
      this.limparFormulario();
    })
    .catch(error => {
      this.isLoading = false;
      this.errorMessage = 'Erro ao salvar empresa. Verifique sua autenticação.';
      console.error('Erro ao salvar empresa:', error);
      this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
    });
  }

  validarCamposEmpresa(): boolean {
    const camposObrigatorios: (keyof Company)[] = [
      'cnpj', 'email', 'nomeFantasia', 'telefone'
    ];

    for (const campo of camposObrigatorios) {
      if (!this.company[campo]) {
        this.snackBar.open(`O campo ${this.traduzirCampo(campo)} é obrigatório.`, 'Fechar', { duration: 3000 });
        return false;
      }
    }

    return true;
  }

  traduzirCampo(campo: keyof Company): string {
    const traducoes: { [K in keyof Company]?: string } = {
      cnpj: 'CNPJ',
      email: 'E-mail',
      nomeFantasia: 'Nome Fantasia',
      telefone: 'Telefone'
    };
    return traducoes[campo] || String(campo);
  }

  editarEmpresa(empresa: Company) {
    // Preencher o formulário com os dados da empresa selecionada
    this.company = {...empresa};
  }

  excluirEmpresa(empresa: Company) {
    if (!empresa.id) {
      this.snackBar.open('Não foi possível identificar a empresa para exclusão.', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.firebaseService.deleteCompany(empresa.id)
      .then(() => {
        this.isLoading = false;
        this.snackBar.open('Empresa excluída com sucesso!', 'Fechar', { duration: 3000 });
        
        // Recarregar a lista de empresas após exclusão
        this.loadCompanies();
      })
      .catch(error => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao excluir empresa. Verifique sua autenticação.';
        console.error('Erro ao excluir empresa:', error);
        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
      });
  }

  limparFormulario() {
    this.company = {
      cnpj: '',
      email: '',
      idGChat: '',
      nomeFantasia: '',
      nomeGChat: '',
      telefone: '',
      token: ''
    };
  }
}
