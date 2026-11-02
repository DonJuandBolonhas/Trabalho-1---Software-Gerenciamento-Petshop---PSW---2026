// Garante que o StorageService só será declarado se ainda não existir
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

        removerPorId(id) {
            let itens = this.obterTodos();
            itens = itens.filter(item => String(item.id) !== String(id));
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}

/**
 * Controller responsável pelo Formulário de Cadastro e Alteração de Animais
 */
class AnimalController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new StorageService('petshop_animais');
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.salvarAnimal();
        });

        const btnCarregar = document.getElementById('btn-carregar-id');
        if (btnCarregar) {
            btnCarregar.addEventListener('click', () => {
                const idInput = document.getElementById('input-busca-id')?.value.trim();
                if (idInput) {
                    this.carregarAnimalParaEdicao(idInput);
                }
            });
        }
    }

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idUrl = urlParams.get('id');
        if (idUrl) {
            this.carregarAnimalParaEdicao(idUrl);
        }
    }

    carregarAnimalParaEdicao(id) {
        const animal = this.storage.obterPorId(id);

        if (!animal) {
            alert('Animal não encontrado com o ID informado!');
            return;
        }

        this.form.dataset.animalId = animal.id;

        if (document.getElementById('nome')) document.getElementById('nome').value = animal.nome || '';
        if (document.getElementById('tutor')) document.getElementById('tutor').value = animal.tutor || '';
        if (document.getElementById('cpftutor')) document.getElementById('cpftutor').value = animal.cpfTutor || '';
        if (document.getElementById('rganimal')) document.getElementById('rganimal').value = animal.rgAnimal || '';
        if (document.getElementById('peso')) document.getElementById('peso').value = animal.peso || '';
        if (document.getElementById('altura')) document.getElementById('altura').value = animal.altura || '';
        if (document.getElementById('especie')) document.getElementById('especie').value = animal.especie || '';
        if (document.getElementById('data')) document.getElementById('data').value = animal.dataNascimento || '';
        if (document.getElementById('message')) document.getElementById('message').value = animal.anotacoes || '';

        if (animal.genero) {
            const radioGenero = this.form.querySelector(`input[name="sex"][value="${animal.genero}"]`);
            if (radioGenero) radioGenero.checked = true;
        }

        const chkMicro = document.getElementById('micro');
        if (chkMicro) chkMicro.checked = Boolean(animal.microchip);
    }

    obterDadosFormulario() {
        const formData = new FormData(this.form);
        const possuiMicrochip = document.getElementById('micro')?.checked || false;

        return {
            id: this.form.dataset.animalId || null,
            nome: formData.get('nome')?.trim(),
            tutor: formData.get('tutor')?.trim(),
            cpfTutor: formData.get('cpftutor')?.trim(),
            rgAnimal: formData.get('rganimal')?.trim(),
            peso: formData.get('peso')?.trim(),
            altura: formData.get('altura'),
            especie: formData.get('especie')?.trim(),
            genero: formData.get('sex'),
            dataNascimento: formData.get('data'),
            microchip: possuiMicrochip,
            anotacoes: formData.get('message')?.trim(),
            criadoEm: new Date().toISOString()
        };
    }

    validar(animal) {
        if (!animal.nome) {
            alert('Por favor, informe o Nome do animal.');
            return false;
        }
        if (!animal.tutor) {
            alert('Por favor, informe o Nome do Tutor.');
            return false;
        }
        return true;
    }

    salvarAnimal() {
        const animal = this.obterDadosFormulario();

        if (!this.validar(animal)) {
            return;
        }

        try {
            this.storage.salvar(animal);
            const mensagem = animal.id ? 'Animal alterado com sucesso!' : 'Animal cadastrado com sucesso!';
            alert(mensagem);
            
            if (this.form.dataset.animalId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar animal:', error);
            alert('Ocorreu um erro ao salvar o animal.');
        }
    }
}

/**
 * Controller responsável pela Consulta/Listagem de Animais
 */
class AnimalConsultaController {
    constructor() {
        this.storage = new StorageService('petshop_animais');
        this.tabelaBody = document.getElementById('tabela-animais-body');
        this.inputFiltro = document.getElementById('input-filtro');
        this.btnLimpar = document.getElementById('btn-limpar-filtro');

        if (this.tabelaBody) {
            this.iniciar();
        }
    }

    iniciar() {
        this.renderizarTabela();

        if (this.inputFiltro) {
            this.inputFiltro.addEventListener('input', () => {
                const termo = this.inputFiltro.value.toLowerCase().trim();
                this.renderizarTabela(termo);
            });
        }

        if (this.btnLimpar) {
            this.btnLimpar.addEventListener('click', () => {
                this.inputFiltro.value = '';
                this.renderizarTabela();
            });
        }
    }

    renderizarTabela(filtro = '') {
        const animais = this.storage.obterTodos();
        
        const animaisFiltrados = animais.filter(a => {
            const nomeMatch = a.nome && a.nome.toLowerCase().includes(filtro);
            const tutorMatch = a.tutor && a.tutor.toLowerCase().includes(filtro);
            const especieMatch = a.especie && a.especie.toLowerCase().includes(filtro);
            return nomeMatch || tutorMatch || especieMatch;
        });

        this.tabelaBody.innerHTML = '';

        if (animaisFiltrados.length === 0) {
            this.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum animal encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        animaisFiltrados.forEach(animal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${this.escaparHtml(animal.nome || '-')}</strong></td>
                <td>${this.escaparHtml(animal.especie || '-')}</td>
                <td>${this.escaparHtml(animal.tutor || '-')}</td>
                <td>${this.escaparHtml(animal.cpfTutor || '-')}</td>
                <td><span class="badge badge-info">${animal.microchip ? 'Sim' : 'Não'}</span></td>
                <td class="text-center">
                    <a href="alteracao.html?id=${encodeURIComponent(animal.id)}" class="btn btn-sm btn-warning mr-1">Editar</a>
                    <a href="remocao.html?id=${encodeURIComponent(animal.id)}" class="btn btn-sm btn-danger">Excluir</a>
                </td>
            `;
            this.tabelaBody.appendChild(tr);
        });
    }

    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

/**
 * Controller responsável pela Remoção de Animais
 */
class AnimalRemocaoController {
    constructor() {
        this.storage = new StorageService('petshop_animais');
        this.animalAtual = null;

        this.container = document.getElementById('container-remocao-animal');
        this.cardDados = document.getElementById('card-dados-animal');
        this.painelVazio = document.getElementById('painel-vazio');

        if (this.container) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        const btnBuscar = document.getElementById('btn-buscar-animal');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarAnimal());
        }

        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.executarExclusao());
        }
    }

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idUrl = urlParams.get('id');
        if (idUrl) {
            const termoInput = document.getElementById('termoBusca');
            if (termoInput) termoInput.value = idUrl;
            this.carregarAnimalPorId(idUrl);
        }
    }

    buscarAnimal() {
        const termo = document.getElementById('termoBusca')?.value.trim();

        if (!termo) {
            alert('Por favor, digite o ID ou Nome do animal para buscar.');
            return;
        }

        const animais = this.storage.obterTodos();
        let encontrado = animais.find(a => String(a.id) === termo) || 
                         animais.find(a => a.nome && a.nome.toLowerCase().includes(termo.toLowerCase()));

        if (encontrado) {
            this.exibirAnimal(encontrado);
        } else {
            alert('Nenhum animal foi localizado com os dados informados.');
            this.ocultarAnimal();
        }
    }

    carregarAnimalPorId(id) {
        const animal = this.storage.obterPorId(id);
        if (animal) {
            this.exibirAnimal(animal);
        } else {
            alert('Animal não encontrado com o ID informado.');
            this.ocultarAnimal();
        }
    }

    exibirAnimal(animal) {
        this.animalAtual = animal;

        if (document.getElementById('info-id')) document.getElementById('info-id').textContent = animal.id ? `#${animal.id}` : '-';
        if (document.getElementById('info-nome')) document.getElementById('info-nome').textContent = animal.nome || '-';
        if (document.getElementById('info-especie')) document.getElementById('info-especie').textContent = animal.especie || '-';
        if (document.getElementById('info-tutor')) document.getElementById('info-tutor').textContent = animal.tutor || '-';
        if (document.getElementById('info-cpftutor')) document.getElementById('info-cpftutor').textContent = animal.cpfTutor || '-';

        if (document.getElementById('modal-nome-animal')) {
            document.getElementById('modal-nome-animal').textContent = animal.nome || 'Animal';
        }

        if (this.painelVazio) this.painelVazio.classList.add('d-none');
        if (this.cardDados) this.cardDados.classList.remove('d-none');
    }

    ocultarAnimal() {
        this.animalAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

    executarExclusao() {
        if (!this.animalAtual || !this.animalAtual.id) {
            alert('Nenhum animal selecionado para remoção.');
            return;
        }

        try {
            this.storage.removerPorId(this.animalAtual.id);

            if (typeof $ !== 'undefined') {
                $('#modalConfirmacao').modal('hide');
            }

            alert('Animal removido com sucesso!');
            window.location.href = 'consulta.html';
        } catch (error) {
            console.error('Erro ao remover animal:', error);
            alert('Ocorreu um erro ao tentar excluir o animal.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-animal')) {
        new AnimalController('form-animal');
    }
    
    if (document.getElementById('tabela-animais-body')) {
        new AnimalConsultaController();
    }

    if (document.getElementById('container-remocao-animal')) {
        new AnimalRemocaoController();
    }
});
