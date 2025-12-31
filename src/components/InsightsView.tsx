
import React, { useState, useRef, useEffect } from 'react';
import { Producer, ChatMessage, KnowledgeFile } from '../types';
import { chatWithInsights } from '../services/geminiService';
import { marked } from 'marked';
import { 
  BrainCircuit, Loader2, Send, Plus, 
  User, Sparkles, AlertCircle,
  Copy, Check, ShieldAlert
} from 'lucide-react';

interface Props {
  producers: Producer[];
  knowledgeBase: KnowledgeFile[];
  systemInstruction: string;
}

const InsightsView: React.FC<Props> = ({ producers, knowledgeBase, systemInstruction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    let fullResponse = '';
    const aiMessage: ChatMessage = {
      role: 'model',
      text: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);

    try {
      const stream = chatWithInsights(
        input,
        messages,
        producers,
        knowledgeBase,
        systemInstruction
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = "Une erreur de connexion est survenue. Veuillez réessayer.";
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMarkdown = (text: string) => {
    const html = marked.parse(text);
    return { __html: html };
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Zone de Chat Principale */}
      <main className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-lg overflow-hidden relative">
        
        {/* Header Chat - Rebrandé TOLBI xAI */}
        <div className="p-4 px-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-[#FFCB05] shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tighter uppercase leading-none">TOLBI xAI Assistant</h2>
              <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Investigation Agronomique active</p>
            </div>
          </div>
          
          <button 
            onClick={() => setMessages([])} 
            className="px-3 py-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
          >
             Réinitialiser la session
          </button>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-slate-50/10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto py-12">
               <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-[#FFCB05] mb-6 shadow-2xl rotate-3">
                 <BrainCircuit size={32} />
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tighter">Outil d'Investigation</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                 TOLBI xAI est un véritable outil d'investigation agronomique connecté à vos parcelles et guides techniques.
               </p>
               <div className="grid grid-cols-1 gap-2 w-full">
                  <QuickQuestion label="Quelles sont les parcelles critiques ?" onClick={setInput} />
                  <QuickQuestion label="Besoin de fertilisation moyen ?" onClick={setInput} />
                  <QuickQuestion label="Rapport de production par Union." onClick={setInput} />
               </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 md:gap-4 animate-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                m.role === 'user' ? 'bg-[#006B3D] text-white' : 'bg-slate-900 text-[#FFCB05]'
              }`}>
                {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`relative max-w-[85%] md:max-w-[80%] p-5 md:p-6 rounded-[24px] shadow-sm border ${
                m.role === 'user' 
                ? 'bg-[#006B3D] border-[#006B3D] text-white rounded-tr-none' 
                : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                <div className={`prose prose-xs max-w-none prose-p:leading-normal prose-headings:text-inherit ${m.role === 'user' ? 'prose-invert prose-p:text-emerald-50' : ''}`}>
                   {m.role === 'user' ? (
                     <p className="m-0 text-xs font-medium">{m.text}</p>
                   ) : (
                     <div className="text-xs" dangerouslySetInnerHTML={renderMarkdown(m.text)} />
                   )}
                </div>
                <div className={`mt-5 pt-3 border-t flex justify-between items-center ${m.role === 'user' ? 'border-emerald-700/20' : 'border-slate-50'}`}>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${m.role === 'user' ? 'text-emerald-200/40' : 'text-slate-300'}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {m.role === 'model' && m.text && (
                    <button 
                      onClick={() => copyToClipboard(m.text, i)}
                      className="text-slate-300 hover:text-slate-900 transition-all flex items-center gap-1.5 p-1 rounded hover:bg-slate-50"
                    >
                       {copiedId === i ? (
                         <><Check size={10} className="text-emerald-500" /><span className="text-[8px] font-black uppercase text-emerald-500">Copié</span></>
                       ) : (
                         <><Copy size={10} /><span className="text-[8px] font-black uppercase tracking-widest">Copier le rapport</span></>
                       )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-[#FFCB05] flex items-center justify-center animate-pulse">
                <Sparkles size={14} />
              </div>
              <div className="bg-white border border-slate-100 p-4 px-6 rounded-[24px] rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                   <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce"></span>
                   <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                   <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Analyse xAI...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-50">
          <div className="relative flex items-center gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Votre question d'investigation..."
                className="w-full pl-6 pr-14 py-3.5 bg-slate-50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-[20px] text-xs font-medium outline-none transition-all shadow-inner"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-900 text-[#FFCB05] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-20"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          
          {/* Disclaimer Footer - Obligatoire */}
          <div className="mt-4 flex flex-col items-center gap-1">
             <div className="flex items-center gap-2 text-slate-300">
                <ShieldAlert size={10} className="text-amber-500" />
                <p className="text-[8px] font-bold uppercase tracking-tight">
                  TOLBI xAI peut se tromper. Vérifiez les informations importantes.
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const QuickQuestion = ({ label, onClick }: { label: string, onClick: (v: string) => void }) => (
  <button 
    onClick={() => onClick(label)}
    className="px-4 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-tight hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all text-left shadow-sm flex items-center justify-between group"
  >
    {label}
    <Plus size={12} className="text-slate-200 group-hover:text-slate-900 transition-all" />
  </button>
);

export default InsightsView;
