'use client';

import { useState, useRef, useEffect } from 'react';
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
    const [isConfigured, setIsConfigured] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carregar API Key do localStorage
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
            setIsConfigured(true);
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
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const history = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // Contexto do Sistema (Injetado via prompt inicial hidden ou system instruction se disponível)
            // Aqui vamos usar uma abordagem de prompt engineering no início da conversa ou a cada request
            const contextPrompt = `
                Você é o Oráculo, uma I.A. assistente para Mestres de RPG de Mesa (D&D 5e).
                Você está auxiliando na campanha: "${campaign.name}".
                Descrição da campanha: "${campaign.description || "Uma aventura misteriosa"}".
                
                Seu objetivo é ajudar o Mestre com:
                - Ideias de plot twists
                - Descrições de locais e NPCs
                - Regras (se perguntado)
                - Lore profunda baseada na descrição.
                
                Mantenha um tom místico mas útil. Seja conciso.
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
            const text = response.text();

            setMessages(prev => [...prev, { role: 'model', text: text }]);
        } catch (err: any) {
            console.error("Erro na I.A.:", err);
            setError("Os ventos da magia estão turbulentos (Erro na API). Verifique sua chave ou tente novamente.");
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
                    className="w-full p-2 mb-4 bg-rpg-slate border border-rpg-gold/30 rounded text-rpg-parchment focus:border-rpg-gold outline-none"
                />
                <button
                    onClick={handleSaveKey}
                    className="bg-rpg-gold text-rpg-dark font-bold px-6 py-2 rounded hover:bg-rpg-gold/80 transition-all font-cinzel"
                >
                    Conectar ao Plano Astral
                </button>
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
