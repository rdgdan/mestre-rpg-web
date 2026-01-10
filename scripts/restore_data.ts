// scripts/restore_data.ts
// import 'undici/shim';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tritaoData = {
    name: "Tritão",
    slug: "tritao",
    source: "Volo's Guide to Monsters",
    description: "Tritões guardam as profundezas oceânicas, construindo pequenos assentamentos ao lado de fossas profundas, portais para os planos elementais e outros pontos perigosos longe dos olhos dos habitantes da terra. Guardiões de longa data das profundezas, os tritões privilegiam a justiça e a ordem, e têm pouca paciência para as disputas mesquinhas dos povos da superfície.",
    traits: [
        {
            name: "Aumento no Valor de Habilidade",
            text: "Sua Força, Constituição e Carisma aumentam em 1."
        },
        {
            name: "Idade",
            text: "Tritões atingem a maturidade por volta dos 15 anos e podem viver até 200 anos."
        },
        {
            name: "Tendência",
            text: "Tritões tendem para a ordem e o bem, protegendo os oceanos de ameaças."
        },
        {
            name: "Tamanho",
            text: "Tritões são um pouco mais baixos que humanos, com cerca de 1,5m. Seu tamanho é Médio."
        },
        {
            name: "Deslocamento",
            text: "Seu deslocamento base de caminhada é 9 metros, e você tem deslocamento de natação de 9 metros."
        },
        {
            name: "Anfíbio",
            text: "Você pode respirar ar e água."
        },
        {
            name: "Controle do Ar e Água",
            text: "Uma criança do mar, você pode conjurar 'Névoa' com este traço. A partir do 3º nível, você pode conjurar 'Rajada de Vento' com ele, e a partir do 5º nível, você pode também conjurar 'Muralha de Água' com ele. Depois de conjurar qualquer uma dessas magias com esse traço, você não pode conjurar a mesma magia novamente até terminar um descanso longo. Carisma é sua habilidade de conjuração para essas magias."
        },
        {
            name: "Emissário do Mar",
            text: "Bestas aquáticas têm uma afinidade extraordinária com seu povo. Você pode se comunicar ideias simples com bestas que podem respirar na água. Elas podem entender o significado de suas palavras, embora você não tenha nenhuma habilidade especial para entender elas em retorno."
        },
        {
            name: "Guardiões das Profundezas",
            text: "Adaptado até mesmo às profundezas mais extremas do oceano, você tem resistência a dano de frio, e você ignora quaisquer desvantagens causadas por um ambiente subaquático profundo."
        }
    ],
    translated: true
};

async function restore() {
    try {
        console.log('🩹 Restaurando "Tritão" na coleção "races"...');
        const docRef = await addDoc(collection(db, 'races'), tritaoData);
        console.log(`✅ Sucesso! Item restaurado com ID: ${docRef.id}`);
    } catch (e: any) {
        console.error('❌ Erro ao restaurar:', e);
    }
}

restore();
