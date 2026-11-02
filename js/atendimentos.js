// Reutiliza o StorageService se não estiver declarado globalmente
if (typeof window.StorageService === 'undefined') {
    window.StorageService = class StorageService {
        constructor(key) {
            this.key = key;
        }

        obterTodos() {
            const dados = localStorage.getItem(this.key);
            return dados ? JSON.parse(dados) : [];
        }

        obterPorId(id) {
            const itens = this.obterTodos();
            return itens.find(item => item.id === String(id)) || null;
        }

        obterPorCpf(cpf) {
            const itens = this.obterTodos();
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            return itens.find(item => String(item.cpf).replace(/\D/g, '') === cpfLimpo) || null;
        }

        salvar(item) {
            const itens = this.obterTodos();
            
            if (!item.id) {
                item.id = Date.now().toString();
                itens.push(item);
            } else {
                const index = itens.findIndex(i => i.id === String(item.id));
                if (index !== -1) {
                    itens[index] = { ...itens[index], ...item };
                }
            }
            
            localStorage.setItem(this.key, JSON.stringify(itens));
            return item;
        }

        removerPorCpf(cpf) {
            let itens = this.obterTodos();
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            itens = itens.filter(item => String(item.cpf).replace(/\D/g, '') !== cpfLimpo);
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}

/**
 * Controller responsável pelo Formulário de Funcionários
 */
class FuncionarioController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        // Utiliza a chave "funcionarios" para sincronizar com o relatório da Home
        this.storage = new StorageService('funcionarios');
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.salvarFuncionario();
        });
    }

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            this.carregarFuncionarioParaEdicao(cpfUrl);
        }
    }

    carregarFuncionarioParaEdicao(cpf) {
        const funcionario = this.storage.obterPorCpf(cpf);

        if (!funcionario) {
            alert('Funcionário não encontrado com o CPF informado!');
            return;
        }

        this.form.dataset.funcionarioId = funcionario.id;

        if (document.getElementById('nome')) document.getElementById('nome').value = funcionario.nome || '';
        if (document.getElementById('cpf')) document.getElementById('cpf').value = funcionario.cpf || '';
        if (document.getElementById('cargo')) document.getElementById('cargo').value = funcionario.cargo || '';
        if (document.getElementById('salario')) document.getElementById('salario').value = funcionario.salario || '';
        if (document.getElementById('telefone')) document.getElementById('telefone').value = funcionario.telefone || '';
        if (document.getElementById('email')) document.getElementById('email').value = funcionario.email || '';
        if (document.getElementById('dataAdmissao')) document.getElementById('dataAdmissao').value = funcionario.dataAdmissao || '';
        if (document.getElementById('anotacoes')) document.getElementById('anotacoes').value = funcionario.anotacoes || '';
    }

    obterDadosFormulario() {
        const formData = new FormData(this.form);

        return {
            id: this.form.dataset.funcionarioId || null,
            nome: formData.get('nome')?.trim(),
            cpf: formData.get('cpf')?.trim(),
            cargo: formData.get('cargo'),
            salario: formData.get('salario'),
            telefone: formData.get('telefone')?.trim(),
            email: formData.get('email')?.trim(),
            dataAdmissao: formData.get('dataAdmissao'),
            anotacoes: formData.get('anotacoes'),
            criadoEm: new Date().toISOString()
        };
    }

    validar(funcionario) {
        if (!funcionario.nome) {
            alert('Por favor, informe o Nome do funcionário.');
            return false;
        }
        if (!funcionario.cpf) {
            alert('Por favor, informe o CPF do funcionário.');
            return false;
        }
        return true;
    }

    salvarFuncionario() {
        const funcionario = this.obterDadosFormulario();

        if (!this.validar(funcionario)) {
            return;
        }

        try {
            this.storage.salvar(funcionario);
            const mensagem = funcionario.id ? 'Funcionário alterado com sucesso!' : 'Funcionário cadastrado com sucesso!';
            alert(mensagem);
            
            if (this.form.dataset.funcionarioId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar funcionário:', error);
            alert('Ocorreu um erro ao salvar o funcionário.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-funcionario')) {
        new FuncionarioController('form-funcionario');
    }
});