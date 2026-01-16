'use client';

import { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Campaign } from '@/types/campaign';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface CampaignOracleProps {
    campaign: Campaign;
}

export default function CampaignOracle({ campaign }: CampaignOracleProps) {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [isConfigured, setIsConfigured] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carregar API Key e Modelo do localStorage
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        const storedModel = localStorage.getItem('gemini_model');
        if (storedKey) {
            setApiKey(storedKey);
            setIsConfigured(true);
        }
        if (storedModel) {
            setSelectedModel(storedModel);
        }
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSaveKey = () => {
        if (!apiKey.trim()) return;
        localStorage.setItem('gemini_api_key', apiKey);
        setIsConfigured(true);
        // Mensagem inicial de boas-vindas
        setMessages([
            { role: 'model', text: `Saudações, Mestre. Eu sou o Oráculo de "${campaign.name}". Conheço os segredos desta terra. O que desejas saber?` }
        ]);
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setIsConfigured(false);
        setMessages([]);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !apiKey) return;

        const userMessage = inputText;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInputText('');
        setIsLoading(true);
        setError(null);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);

            // Lista exaustiva de modelos (Atualizada com log do usuário)
            const modelsToTry = [
                'gemini-2.0-flash',
                'gemini-2.0-flash-lite-preview',
                'gemini-exp-1206',
                'gemini-2.5-flash-preview-tts',
                'gemini-2.5-pro-preview-tts',
                'gemma-3-27b-it',
                'gemma-3-12b-it',
                'gemma-3-4b-it',
                'gemma-3-1b-it',
                'gemini-1.5-flash',
                'gemini-1.5-flash-8b',
                'gemini-1.5-pro',
                'gemini-flash-latest',
                'gemini-2.0-pro-exp-02-05',
                'gemini-1.5-pro-latest',
                'gemini-pro'
            ];

            let responseText = "";
            let successModel = "";

            // Tenta conectar com modelos em ordem
            for (const modelName of modelsToTry) {
                try {
                    console.log(`Tentando modelo: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const history = messages.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    }));

                    const contextPrompt = `
                        Você é o Oráculo, uma I.A. assistente para Mestres de RPG de Mesa (D&D 5e).
                        Você está auxiliando na campanha: "${campaign.name}".
                        Descrição da campanha: "${campaign.description || "Uma aventura misteriosa"}".
                        Mantenha um tone místico mas útil. Seja conciso.
                    `;

                    const chat = model.startChat({
                        history: [
                            {
                                role: 'user',
                                parts: [{ text: contextPrompt + "\n\nEntendido. Aguardo a primeira pergunta." }]
                            },
                            {
                                role: 'model',
                                parts: [{ text: "Entendido, Mestre. Estou pronto para servir à narrativa." }]
                            },
                            ...history
                        ]
                    });

                    const result = await chat.sendMessage(userMessage);
                    const response = result.response;
                    responseText = response.text();
                    successModel = modelName;
                    break; // Sucesso! Sai do loop
                } catch (innerErr: any) {
                    logger.warn(`Falha no modelo ${modelName}:`, innerErr.message);
                    // Continua para o próximo modelo
                }
            }

            if (!responseText) {
                throw new Error("Nenhum modelo disponível respondeu. Verifique sua cota ou chave API.");
            }

            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
            // Opcional: Atualizar UI para mostrar qual modelo respondeu (não solicitado, mas útil para debug)
            console.log(`Sucesso com ${successModel}`);

        } catch (err: any) {
            console.error("Erro na I.A. (Todos modelos falharam):", err);
            setError(`O Oráculo silenciou. (Erro: ${err.message})`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConfigured) {
        return (
            <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 max-w-md mx-auto mt-10 text-center">
                <div className="mb-4 text-4xl">🔮</div>
                <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">Invoque o Oráculo</h3>
                <p className="text-rpg-parchment/80 mb-4 text-sm font-medieval">
                    Para utilizar a sabedoria do Oráculo (I.A.), você precisa de uma chave de API do Google Gemini.
                    É gratuita para uso pessoal.
                </p>
                <input
                    type="password"
                    placeholder="Cole sua API Key aqui"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 mb-2 bg-rpg-slate border border-rpg-gold/30 rounded text-rpg-parchment focus:border-rpg-gold outline-none"
                />
                <div className="mb-4 text-xs text-center text-rpg-gold/60 font-cinzel border border-rpg-gold/10 rounded p-2">
                    <span className="block mb-1">Modelo de Inteligência Artificial</span>
                    <strong className="text-rpg-parchment">Seleção Automática (Prioridade: Gratuito)</strong>
                </div>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={handleSaveKey}
                        className="bg-rpg-gold text-rpg-dark font-bold px-6 py-2 rounded hover:bg-rpg-gold/80 transition-all font-cinzel flex-1"
                    >
                        Conectar
                    </button>
                    <button
                        onClick={async () => {
                            if (!apiKey) return alert("Insira uma chave API primeiro.");
                            setIsLoading(true);
                            try {
                                const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ contents: [{ parts: [{ text: "Teste Conexão Oráculo" }] }] })
                                });
                                const data = await response.json();

                                if (!response.ok) {
                                    // Se for 404, tenta listar modelos disponíveis
                                    if (response.status === 404) {
                                        try {
                                            const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                                            const listData = await listResp.json();
                                            const models = listData.models
                                                ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                                                ?.map((m: any) => m.name.replace('models/', ''))
                                                || [];

                                            if (models.length > 0) {
                                                alert(`O modelo '${selectedModel}' não está disponível para sua chave.\n\nMas encontramos estes modelos válidos:\n\n${models.join('\n')}\n\nTente selecionar 'Gemini Pro' ou outro da lista.`);
                                                return;
                                            }
                                        } catch (e) {
                                            console.error("Erro ao listar modelos", e);
                                        }
                                    }

                                    const msg = data.error?.message || JSON.stringify(data.error) || response.statusText;
                                    alert(`Erro no Google (${response.status}): ${msg}`);
                                } else {
                                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ok";
                                    alert(`Conexão BEM SUCEDIDA! (Via REST)\nResposta: "${text}"\n\nA API está funcionando com o modelo ${selectedModel}.`);
                                }
                            } catch (err: any) {
                                alert(`Erro de Rede (O computador não alcançou o Google): ${err.message}`);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        className="bg-white/10 text-white font-bold px-4 py-2 rounded hover:bg-white/20 transition-all font-cinzel border border-white/20"
                        title="Testar se a chave funciona"
                    >
                        Testar
                    </button>
                </div>
                <div className="mt-4 text-xs text-rpg-grey">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-rpg-gold">
                        Obter chave gratuita aqui
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-rpg-slate/30 border border-rpg-gold/20 rounded-lg overflow-hidden">
            {/* Header do Chat */}
            <div className="bg-rpg-panel p-3 border-b border-rpg-gold/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔮</span>
                    <h3 className="font-cinzel text-rpg-gold font-bold">Oráculo da Campanha</h3>
                </div>
                <button
                    onClick={handleClearKey}
                    className="text-xs text-rpg-grey hover:text-red-400 font-medieval"
                    title="Desconectar Key"
                >
                    Esquecer Chave
                </button>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                {messages.length === 0 && (
                    <div className="text-center text-rpg-grey/50 mt-10 font-medieval">
                        <p>O Oráculo aguarda sua consulta...</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-rpg-gold/10 border border-rpg-gold/20 text-rpg-parchment rounded-tr-none'
                                : 'bg-rpg-panel border border-white/10 text-rpg-parchment/90 rounded-tl-none shadow-lg'
                                }`}
                        >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-rpg-panel border border-white/10 p-3 rounded-lg rounded-tl-none">
                            <div className="flex gap-1 animate-pulse">
                                <span className="w-2 h-2 bg-rpg-gold/50 rounded-full"></span>
                                <span className="w-2 h-2 bg-rpg-gold/50 rounded-full animation-delay-200"></span>
                                <span className="w-2 h-2 bg-rpg-gold/50 rounded-full animation-delay-400"></span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-red-400 text-xs text-center p-2 bg-red-900/20 rounded border border-red-500/20">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-rpg-panel border-t border-rpg-gold/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Pergunte ao Oráculo..."
                        className="flex-grow bg-rpg-slate border border-rpg-gold/20 rounded px-4 py-2 text-rpg-parchment focus:outline-none focus:border-rpg-gold placeholder-rpg-grey/40"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputText.trim()}
                        className="bg-rpg-gold hover:bg-rpg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed text-rpg-dark font-bold px-4 py-2 rounded transition-colors"
                    >
                        ⚡
                    </button>
                </div>
            </div>
        </div>
    );
}
