import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FirebaseService, Company } from '../../../core/services/firebase.service';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ChannelService } from '../../../core/services/channel.service';
import { ChannelResponse } from '../../../core/interfaces/channel.interface';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Sobrescrever a definição de User para incluir senha
interface User {
  id?: string;
  nome: string;
  email: string;
  permissao: 'admin' | 'usuario' | 'visualizador';
  senha?: string; // Adicionar campo de senha
}

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
    MatSnackBarModule,
    MatPaginatorModule
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

  isEditMode = false;
  editingCompanyId: string | null = null;

  // Pagination properties
  pageSize = 10; // 10 empresas por página
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtered and paginated companies list
  get paginatedCompaniesList(): Company[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.companiesList.slice(startIndex, endIndex);
  }

  // Usuários
  user: User = this.resetUserForm();
  usersList: User[] = [];
  isUserEditMode = false;
  editingUserId?: string; // Modificar para aceitar undefined
  private userSubscription?: Subscription;

  // Variáveis para controle de senha
  showPassword = false;

  // Variáveis de força de senha
  passwordStrengthClass = '';
  passwordStrengthText = '';

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private channelService: ChannelService
  ) {
    console.log('SettingsComponent: Constructor called');
  }

  ngOnInit() {
    console.log('SettingsComponent: ngOnInit called');
    this.loadCompanies();
    this.loadUsers();
  }

  ngOnDestroy() {
    if (this.companiesSubscription) {
      this.companiesSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
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

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userSubscription = this.firebaseService.getUsers()
      .subscribe({
        next: (users) => {
          this.usersList = users;
          this.isLoading = false;
          
          if (users.length === 0) {
            this.snackBar.open('Nenhum usuário encontrado.', 'Fechar', { duration: 3000 });
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erro ao carregar usuários. Verifique sua autenticação.';
          console.error('Erro ao carregar usuários:', error);
          this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
        }
      });
  }

  setActiveTab(tab: 'companies' | 'users' | 'settings') {
    this.activeTab = tab;
  }

  buscarToken() {
    if (!this.company.token) {
      this.snackBar.open('Por favor, insira um token válido.', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.channelService.getChannelInfo(this.company.token)
      .subscribe({
        next: (response: ChannelResponse) => {
          // Preencher campos automaticamente
          if (response.identifier) {
            this.company.telefone = response.identifier;
          }
          
          // ID G-Chat fixo conforme especificado
          this.company.idGChat = '649dc6f895478db1c37790f2';
          
          if (response.description) {
            this.company.nomeGChat = response.description;
          }

          this.isLoading = false;
          this.snackBar.open('Informações do canal carregadas com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erro ao buscar informações do canal:', error);
          
          let errorMessage = 'Erro ao buscar informações do canal.';
          if (error.error && error.error.msg) {
            errorMessage = error.error.msg;
          }

          this.snackBar.open(errorMessage, 'Fechar', { 
            duration: 5000 
          });
        }
      });
  }

  salvarEmpresa() {
    // Validar campos obrigatórios
    if (!this.validarCamposEmpresa()) {
      return;
    }

    // Verificar se já existe um CNPJ igual
    const cnpjExistente = this.companiesList.find(
      empresa => 
        empresa.cnpj.replace(/[^\d]/g, '') === this.company.cnpj.replace(/[^\d]/g, '') &&
        empresa.id !== this.editingCompanyId
    );

    if (cnpjExistente) {
      this.snackBar.open('Já existe uma empresa cadastrada com este CNPJ.', 'Fechar', { 
        duration: 5000 
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Determinar se é uma adição ou atualização
    const saveOperation = this.isEditMode && this.editingCompanyId 
      ? this.firebaseService.updateCompany({
          id: this.editingCompanyId,
          ...this.company
        })
      : this.firebaseService.addCompany(this.company);

    saveOperation
      .then(() => {
        this.isLoading = false;
        const successMessage = this.isEditMode 
          ? 'Empresa atualizada com sucesso!' 
          : 'Empresa salva com sucesso!';
        
        this.snackBar.open(successMessage, 'Fechar', { duration: 3000 });
        
        // Recarregar a lista de empresas após salvar
        this.loadCompanies();
        
        // Limpar o formulário e sair do modo de edição
        this.limparFormulario();
        this.cancelarEdicao();
      })
      .catch(error => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao salvar empresa. Verifique sua autenticação.';
        console.error('Erro ao salvar empresa:', error);
        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
      });
  }

  editarEmpresa(empresa: Company) {
    // Entrar no modo de edição
    this.isEditMode = true;
    this.editingCompanyId = empresa.id || null;

    // Preencher o formulário com os dados da empresa selecionada
    this.company = {
      cnpj: empresa.cnpj,
      email: empresa.email,
      idGChat: empresa.idGChat,
      nomeFantasia: empresa.nomeFantasia,
      nomeGChat: empresa.nomeGChat,
      telefone: empresa.telefone,
      token: empresa.token
    };
  }

  cancelarEdicao() {
    // Sair do modo de edição
    this.isEditMode = false;
    this.editingCompanyId = null;
    this.limparFormulario();
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

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Método para formatar CNPJ
  formatarCNPJ() {
    if (this.company.cnpj) {
      // Remove caracteres não numéricos
      const cnpjNumerico = this.company.cnpj.replace(/[^\d]/g, '');
      
      // Verifica se o CNPJ tem 14 dígitos
      if (cnpjNumerico.length === 14) {
        // Formata o CNPJ
        this.company.cnpj = cnpjNumerico.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
          '$1.$2.$3/$4-$5'
        );
      }
    }
  }

  // Método para formatar telefone
  formatarTelefone() {
    if (this.company.telefone) {
      // Remove caracteres não numéricos
      const telefoneNumerico = this.company.telefone.replace(/[^\d]/g, '');
      
      // Verifica se o telefone tem 10 ou 11 dígitos
      if (telefoneNumerico.length === 10) {
        // Formata telefone fixo
        this.company.telefone = telefoneNumerico.replace(
          /^(\d{2})(\d{4})(\d{4})$/,
          '($1) $2-$3'
        );
      } else if (telefoneNumerico.length === 11) {
        // Formata celular
        this.company.telefone = telefoneNumerico.replace(
          /^(\d{2})(\d{5})(\d{4})$/,
          '($1) $2-$3'
        );
      }
    }
  }

  // Métodos de usuário
  resetUserForm(): User {
    return {
      nome: '',
      email: '',
      permissao: 'usuario',
      senha: '' // Adicionar valor padrão para senha
    };
  }

  salvarUsuario() {
    // Validar campos do usuário
    if (!this.validarCamposUsuario()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Preparar dados do usuário
    const userData: Omit<User, 'id'> = {
      nome: this.user.nome,
      email: this.user.email,
      permissao: this.user.permissao,
      senha: this.user.senha // Incluir senha
    };

    // Verificar se está em modo de edição
    if (this.isUserEditMode && this.editingUserId) {
      // Atualizar usuário existente
      this.firebaseService.updateUser({
        ...userData,
        id: this.editingUserId
      }).then(() => {
        this.snackBar.open('Usuário atualizado com sucesso!', 'Fechar', { duration: 3000 });
        this.loadUsers();
        this.limparFormularioUsuario();
        this.isUserEditMode = false;
        this.editingUserId = undefined; // Limpar ID de edição
      }).catch(error => {
        this.errorMessage = 'Erro ao atualizar usuário. Verifique sua autenticação.';
        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
        console.error('Erro ao atualizar usuário:', error);
      }).finally(() => {
        this.isLoading = false;
      });
    } else {
      // Adicionar novo usuário
      this.firebaseService.addUser(userData)
        .then(() => {
          this.snackBar.open('Usuário cadastrado com sucesso!', 'Fechar', { duration: 3000 });
          this.loadUsers();
          this.limparFormularioUsuario();
        })
        .catch(error => {
          this.errorMessage = 'Erro ao cadastrar usuário. Verifique sua autenticação.';
          this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
          console.error('Erro ao cadastrar usuário:', error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  editarUsuario(usuario: User) {
    this.isUserEditMode = true;
    this.editingUserId = usuario.id;
    this.user = {
      nome: usuario.nome,
      email: usuario.email,
      permissao: usuario.permissao,
      senha: usuario.senha || '' // Adicionar campo de senha
    };
  }

  cancelarEdicaoUsuario() {
    // Sair do modo de edição
    this.isUserEditMode = false;
    this.editingUserId = undefined; // Modificar para aceitar undefined
    this.limparFormularioUsuario();
  }

  excluirUsuario(usuario: User) {
    if (!usuario.id) {
      this.snackBar.open('Não foi possível identificar o usuário para exclusão.', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.firebaseService.deleteUser(usuario.id)
      .then(() => {
        this.isLoading = false;
        this.snackBar.open('Usuário excluído com sucesso!', 'Fechar', { duration: 3000 });
        
        // Recarregar a lista de usuários após exclusão
        this.loadUsers();
      })
      .catch(error => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao excluir usuário. Verifique sua autenticação.';
        console.error('Erro ao excluir usuário:', error);
        this.snackBar.open(this.errorMessage, 'Fechar', { duration: 5000 });
      });
  }

  validarCamposUsuario(): boolean {
    const camposObrigatorios: (keyof User)[] = [
      'nome', 'email', 'permissao', 'senha'
    ];

    for (const campo of camposObrigatorios) {
      if (!this.user[campo]) {
        const nomeCampo = this.traduzirCampoUsuario(campo);
        this.snackBar.open(`${nomeCampo} é obrigatório`, 'Fechar', { duration: 3000 });
        return false;
      }
    }
    return true;
  }

  traduzirCampoUsuario(campo: keyof User): string {
    const traducoes: { [K in keyof User]?: string } = {
      nome: 'Nome',
      email: 'E-mail',
      permissao: 'Permissão',
      senha: 'Senha'
    };
    return traducoes[campo] || String(campo);
  }

  limparFormularioUsuario() {
    this.user = {
      nome: '',
      email: '',
      permissao: 'usuario',
      senha: '' // Adicionar valor padrão para senha
    };
  }

  // Método para alternar visibilidade da senha
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Método para avaliar força da senha
  getPasswordStrength(senha: string): number {
    let strength = 0;
    
    // Critérios de força da senha
    if (senha.length >= 8) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/[a-z]/.test(senha)) strength++;
    if (/[0-9]/.test(senha)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) strength++;

    return strength;
  }

  // Método para obter classe de força da senha
  getPasswordStrengthClass(): string {
    if (!this.user.senha) return '';
    
    const strength = this.getPasswordStrength(this.user.senha);
    
    switch(strength) {
      case 0:
      case 1:
        return 'strength-weak';
      case 2:
      case 3:
        return 'strength-medium';
      case 4:
      case 5:
        return 'strength-strong';
      default:
        return '';
    }
  }

  // Método para obter texto de força da senha
  getPasswordStrengthText(): string {
    if (!this.user.senha) return '';
    
    const strength = this.getPasswordStrength(this.user.senha);
    
    switch(strength) {
      case 0:
      case 1:
        return 'Senha fraca';
      case 2:
      case 3:
        return 'Senha média';
      case 4:
      case 5:
        return 'Senha forte';
      default:
        return '';
    }
  }

  // Método para validar força da senha
  validatePasswordStrength() {
    if (!this.user.senha) {
      this.passwordStrengthClass = '';
      this.passwordStrengthText = '';
      return;
    }

    const strength = this.getPasswordStrength(this.user.senha);
    
    switch(strength) {
      case 0:
      case 1:
        this.passwordStrengthClass = 'strength-weak';
        this.passwordStrengthText = 'Senha muito fraca';
        break;
      case 2:
      case 3:
        this.passwordStrengthClass = 'strength-medium';
        this.passwordStrengthText = 'Senha média';
        break;
      case 4:
      case 5:
        this.passwordStrengthClass = 'strength-strong';
        this.passwordStrengthText = 'Senha forte';
        break;
      default:
        this.passwordStrengthClass = '';
        this.passwordStrengthText = '';
    }
  }

  // Método para validar todo o formulário
  isFormValid(): boolean {
    // Validar campos obrigatórios
    if (!this.user.nome || !this.user.email || !this.user.permissao || !this.user.senha) {
      return false;
    }

    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      return false;
    }

    // Validar força da senha
    const passwordStrength = this.getPasswordStrength(this.user.senha);
    return passwordStrength >= 3; // Requer pelo menos força média
  }
}
