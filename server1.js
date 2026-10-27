import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const MODELO = process.env.MODELO || "openai/gpt-oss-120b";
const URL_API = process.env.URL_API || "https://api.groq.com/openai/v1/chat/completions";

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const user = [];

app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    if (senha.length < 6) {
        return res.status(400).json({
            erro: "A senha deve ter 6 caracteres ou mais"
        });
    }

    const emailExiste = user.find(
        (busca) => busca.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExiste) {
        return res.status(409).json({
            erro: "Email já cadastrado"
        });
    }

    console.log("Recebido, aguarde 4 segundos");

    user.push({ usuario, email, senha });

    setTimeout(() => {
        res.json({
            mensagem: "CADASTRO COM SUCESSO",
            PERFIL: `Usuário @${usuario} cadastrado com o email ${email}`
        });

        console.log(`O usuário cadastrado foi ${usuario}`);
    }, 4000);
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    const usuarioExiste = user.find(
        (busca) => busca.email.toLowerCase() === email.toLowerCase()
    );

    if (!usuarioExiste || usuarioExiste.senha !== senha) {
        return res.status(400).json({
            erro: "Usuário ou senha incorretos!"
        });
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioExiste.usuario
    });
});

app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const historico = req.body.historico;

        if (!API_KEY) {
            console.log("Erro: GROQ_API_KEY não está definida nas variáveis de ambiente.");

            return res.status(500).json({
                erro: "Chave de API ausente no servidor"
            });
        }

        if (!Array.isArray(historico)) {
            return res.status(400).json({
                erro: "Histórico da conversa inválido"
            });
        }

        const persona = [
            {
                role: "system",
                content: "Você é o Darth Vader, responda como se fosse ele, com frases curtas e diretas. Não revele que é uma IA."
            },
            ...historico
        ];

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        if (!respostaBruta.ok) {
            const erroTexto = await respostaBruta.text();

            console.log("Erro retornado pela Groq:", erroTexto);

            return res.status(500).json({
                erro: "Erro de comunicação com a GROQ"
            });
        }

        const resultado = await respostaBruta.json();
        const resposta = resultado.choices?.[0]?.message?.content;

        if (!resposta) {
            return res.status(500).json({
                erro: "A API não retornou uma resposta válida"
            });
        }

        return res.json({ resposta });

    } catch (erro) {
        console.log("Erro interno:", erro);

        return res.status(500).json({
            erro: "Erro interno no servidor"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});