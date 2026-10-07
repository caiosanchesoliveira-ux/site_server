import express from 'express';
import cors from 'cors';
import 'dotenv/config';
const app = express()

process.env.NODE_TLS_REJECT_UNAUTHORIZED= '0'

const PORT = process.env.PORT || 3000
const MODELO = process.env.MODELO || "openai/gpt-oss-120b"
const URL_API = process.env.URL_API || "https://api.groq.com/openai/v1/chat/completions"

app.use(express.json())
app.use(cors())

const user=[]

app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        })
    }
    if (senha.length<6){
        return res.status(400).json({
            erro:"A senha deve ter 6 caracteres ou mais"
        })
    }

    const emailExiste=user.find((busca)=>busca.email===email)

    if (emailExiste){
        return res.status(409).json({
            erro:"Email já cadastrado"
        })
    }
    console.log(`Recebido, aguarde 4 segundos`)
    user.push({usuario, email,senha})

   setTimeout(() => {
        res.json({
            "mensagem": "CADASTRO COM SUCESSO",
            "PERFIL": `Usuario @${usuario} cadastrado com o email ${email}`
        });
        console.log(`O usuario cadastrado foi ${usuario}`)
    }, 4000)

})

app.post('/login', (req, res)=>{
    const {email, senha}=req.body
if(!email || !senha){
    return res.status(400).json({erro:"Preencha todos os campos"})
}
const usuarioExiste=user.find((busca)=> busca.email.toLowerCase()===email.toLowerCase())

if(!usuarioExiste || usuarioExiste.senha!==senha){
    return res.status(400).json({erro: "Usuario ou senha incorretos!"})
}
return res.json({
    mensagem: " Login realizado com sucesso!",
    usuario: usuarioExiste.usuario
})
})

app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const historico = req.body.historico;

        const persona = [
            {
                "role": "system",
                "content": "Você é a Tristeza (Divertidamente). Responda de forma curta, objetiva e bem-humorada."
            }
        ];
        
        persona.push(...historico);

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
            console.log("Erro retornado pela Groq:",resultado);
            return res.status(500).json({ "erro": "Erro de comunicação com a GROQ" });
        }

        const resultado = await respostaBruta.json();
        return res.json({ resposta: resultado.choices[0].message.content });        

    } 
    catch (erro) {
    return res.status(500).json({ "erro": "Erro interno no servidor", "detalhes": error.message });
    }
}); 


app.listen(PORT, () => {
    console.log('Servidor rodando')
})
