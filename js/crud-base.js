/**
 * Servidor de armazenamento genérico usando localStorage.
 * Pode ser reutilizado por qualquer entidade (clientes, animais, etc.).
 */
class StorageService {
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
            // Novo registro: cria um ID único baseado no timestamp
            item.id = Date.now().toString();
            itens.push(item);
        } else {
            // Atualização de registro existente
            const index = itens.findIndex(i => i.id === String(item.id));
            if (index !== -1) {
                itens[index] = { ...itens[index], ...item };
            }
        }
        
        localStorage.setItem(this.key, JSON.stringify(itens));
        return item;
    }

    remover(id) {
        let itens = this.obterTodos();
        itens = itens.filter(item => item.id !== String(id));
        localStorage.setItem(this.key, JSON.stringify(itens));
    }
}