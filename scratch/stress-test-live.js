const http = require('https');

// Altere para a URL oficial do seu backend no Railway (sem a barra final)
const BACKEND_URL = 'https://backend-production-c8f0.up.railway.app';

// Configurações do teste
const SIMULATED_VOTERS = 500; // Número de eleitores simultâneos
const DELAY_BETWEEN_BATCHES_MS = 10; // Delay mínimo entre requisições

// Função auxiliar para requisições HTTP nativas
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BACKEND_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Gerador de CPF matematicamente válido
function gerarCPF() {
  const num = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, num);
  
  let d1 = n.reduce((acc, curr, idx) => acc + curr * (10 - idx), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = [...n, d1].reduce((acc, curr, idx) => acc + curr * (11 - idx), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return [...n, d1, d2].join('');
}

// Nomes de teste para os eleitores
const nomesSobrenomes = [
  ['João', 'Silva'], ['Maria', 'Oliveira'], ['Pedro', 'Santos'],
  ['Ana', 'Souza'], ['Carlos', 'Lima'], ['Lucas', 'Ferreira'],
  ['Juliana', 'Almeida'], ['Marcos', 'Pereira'], ['Fernanda', 'Costa'],
  ['Bruno', 'Ribeiro'], ['Camila', 'Gomes'], ['Rodrigo', 'Rodrigues']
];

function gerarNomeCompleto() {
  const n = nomesSobrenomes[Math.floor(Math.random() * nomesSobrenomes.length)];
  const sobrenome2 = nomesSobrenomes[Math.floor(Math.random() * nomesSobrenomes.length)][1];
  return `${n[0]} ${n[1]} ${sobrenome2}`;
}

// Execução principal do teste
async function runStressTest() {
  console.log(`=== INICIANDO SIMULAÇÃO DE VOTAÇÃO NO RAILWAY ===`);
  console.log(`Endereço do Servidor: ${BACKEND_URL}`);
  console.log(`Carga simulada: ${SIMULATED_VOTERS} eleitores concorrentes\n`);

  console.log('1. Obtendo opções de voto (categorias e candidatas)...');
  let options;
  try {
    const res = await request('GET', '/votes/options');
    if (res.status !== 200) {
      throw new Error(`Servidor respondeu com status ${res.status}`);
    }
    options = res.data;
  } catch (err) {
    console.error('❌ Falha ao obter opções de voto. Verifique se o backend está online e se há concurso ativo cadastrado.');
    console.error(`Erro: ${err.message}`);
    return;
  }

  const { contestId, contestNome, categorias } = options;
  console.log(`   Concurso Ativo: "${contestNome}" (ID: ${contestId})`);
  
  const candidataInfantil = categorias.infantil[0];
  const candidataAdulta = categorias.adulta[0];

  if (!candidataInfantil || !candidataAdulta) {
    console.error('❌ Cadastre pelo menos uma candidata Infantil e uma Adulta antes de rodar o teste!');
    return;
  }

  console.log(`   Votando na Infantil: ${candidataInfantil.nome} (ID: ${candidataInfantil.id})`);
  console.log(`   Votando na Adulta: ${candidataAdulta.nome} (ID: ${candidataAdulta.id})\n`);

  console.log(`2. Iniciando disparos concorrentes para ${SIMULATED_VOTERS} eleitores...`);
  
  const promises = Array.from({ length: SIMULATED_VOTERS }).map(async (_, index) => {
    const cpf = gerarCPF();
    const nome = gerarNomeCompleto();
    const birthDate = '12/10/1995';
    const eleitorLabel = `Eleitor #${index + 1} (${nome.split(' ')[0]})`;

    try {
      // Passo A: Obter o captcha desafio
      const captchaRes = await request('GET', '/votes/captcha');
      if (captchaRes.status !== 200) {
        return { eleitorLabel, step: 'Captcha', success: false, error: 'Falha ao buscar captcha' };
      }

      const { challenge, captchaKey } = captchaRes.data;
      
      // Resolver o captcha (Ex: "Quanto é 5 + 3?")
      const match = challenge.match(/Quanto é (\d+) \+ (\d+)\?/);
      if (!match) {
        return { eleitorLabel, step: 'Resolver Captcha', success: false, error: 'Desafio não reconhecido' };
      }
      const answer = (parseInt(match[1]) + parseInt(match[2])).toString();

      // Passo B: Iniciar a sessão de votação
      const sessionRes = await request('POST', '/votes/session', {
        cpf,
        nomeCompleto: nome,
        dataNascimento: birthDate,
        captchaAnswer: answer,
        captchaKey,
      });

      if (sessionRes.status !== 201) {
        return { eleitorLabel, step: 'Criar Sessão', success: false, error: sessionRes.data?.message ?? 'Erro desconhecido' };
      }

      const { token } = sessionRes.data;

      // Adiciona um pequeno delay antes de submeter o voto
      await new Promise(r => setTimeout(r, index * DELAY_BETWEEN_BATCHES_MS));

      // Passo C: Submeter o voto
      const startTime = Date.now();
      const voteRes = await request('POST', '/votes/submit', {
        candidateChildId: candidataInfantil.id,
        candidateAdultId: candidataAdulta.id,
      }, {
        'Authorization': `Bearer ${token}`
      });
      const duration = Date.now() - startTime;

      if (voteRes.status === 201 || voteRes.status === 200) {
        return { eleitorLabel, step: 'Votar', success: true, duration };
      } else {
        return { eleitorLabel, step: 'Votar', success: false, error: voteRes.data?.message ?? 'Erro na fila' };
      }
    } catch (e) {
      return { eleitorLabel, step: 'Conexão', success: false, error: e.message };
    }
  });

  const results = await Promise.all(promises);

  // Compilar resultados
  const successVotes = results.filter(r => r.success);
  const failedVotes = results.filter(r => !r.success);

  console.log('\n=== RESULTADO DA SIMULAÇÃO ===');
  console.log(`✅ Sucesso: ${successVotes.length} / ${SIMULATED_VOTERS} votos enfileirados`);
  console.log(`❌ Falha: ${failedVotes.length} / ${SIMULATED_VOTERS} erros ocorridos`);

  if (successVotes.length > 0) {
    const avgTime = successVotes.reduce((acc, curr) => acc + curr.duration, 0) / successVotes.length;
    console.log(`⏱️ Tempo médio de resposta do voto: ${avgTime.toFixed(0)}ms`);
  }

  if (failedVotes.length > 0) {
    console.log('\nDetalhamento dos Erros:');
    failedVotes.forEach(f => {
      console.log(`   - ${f.eleitorLabel} falhou no passo [${f.step}]: ${f.error}`);
    });
  }

  console.log('\n*Conselho: Entre no seu painel administrativo (/admin) na aba de relatórios para auditar os votos inseridos e depois limpe os votos se desejar.*');
}

runStressTest().catch(console.error);
