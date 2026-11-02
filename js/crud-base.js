
/**
 * Classe responsável por armazenar e gerenciar dados no localStorage.
 * Ela pode ser utilizada para diferentes tipos de dados, como clientes e animais.
 */
class StorageService {

    // Recebe a chave que será utilizada para identificar os dados armazenados.
    constructor(key) {
        this.key = key;
    }

    // Retorna todos os registros que estão armazenados.
    obterTodos() {

        // Busca os dados no localStorage utilizando a chave definida.
        const dados = localStorage.getItem(this.key);

        // Se existirem dados, transforma o JSON em um array.
        // Caso contrário, retorna um array vazio.
        return dados ? JSON.parse(dados) : [];
    }

    // Busca um registro específico utilizando seu ID.
    obterPorId(id) {

        // Primeiro, obtém todos os registros armazenados.
        const itens = this.obterTodos();

        // Procura um registro que tenha o mesmo ID informado.
        // Se encontrar, retorna o registro. Caso contrário, retorna null.
        return itens.find(item => item.id === String(id)) || null;
    }

    // Salva um novo registro ou atualiza um registro existente.
    salvar(item) {

        // Obtém todos os registros já armazenados.
        const itens = this.obterTodos();

        // Verifica se o registro ainda não possui um ID.
        if (!item.id) {

            // Cria um ID utilizando o horário atual em milissegundos.
            item.id = Date.now().toString();

            // Adiciona o novo registro ao array.
            itens.push(item);

        } else {

            // Procura a posição do registro que possui o mesmo ID.
            const index = itens.findIndex(i => i.id === String(item.id));

            // Verifica se o registro foi encontrado.
            if (index !== -1) {

                // Atualiza o registro encontrado.
                // Os dados antigos são mantidos, mas os novos valores são aplicados.
                itens[index] = { ...itens[index], ...item };
            }
        }

        // Converte o array para JSON e salva os dados no localStorage.
        localStorage.setItem(this.key, JSON.stringify(itens));

        // Retorna o registro que foi salvo.
        return item;
    }

    // Remove um registro utilizando seu ID.
    remover(id) {

        // Obtém todos os registros armazenados.
        let itens = this.obterTodos();

        // Cria um novo array contendo apenas os registros
        // que possuem um ID diferente do informado.
        itens = itens.filter(item => item.id !== String(id));

        // Salva o array atualizado no localStorage.
        localStorage.setItem(this.key, JSON.stringify(itens));
    }
}

