import { useState, useEffect, useCallback, useRef } from 'react';
import { FIRData, Message } from './types';
import { ChatInterface } from './components/ChatInterface';
import { FIRPreview } from './components/FIRPreview';
import { Database as DbIcon, History, Save, Trash2, Loader2, LogIn, LogOut, User, ShieldCheck, Search, Calendar, Filter, X } from 'lucide-react';
import { processChatMessage, processOCR, AIError } from './services/gemini';
import { generateFIRPDF } from './services/pdfService';
import { useSpeech } from './hooks/useSpeech';
import { Scale, Shield, Phone, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

const generateRandomFIR = () => {
  return `${Math.floor(100 + Math.random() * 900).toString()}/${new Date().getFullYear()}`;
};

const INITIAL_FIR: FIRData = {
  district: '',
  ps: '',
  year: new Date().getFullYear().toString(),
  firNo: generateRandomFIR(),
  date: new Date().toLocaleDateString(),
  actsAndSections: '',
  occurrenceDay: '',
  occurrenceDateFrom: '',
  occurrenceTimeFrom: '',
  occurrenceDateTo: '',
  occurrenceTimeTo: '',
  timePeriod: '',
  infoReceivedAtPSDate: '',
  infoReceivedAtPSTime: '',
  gdEntryNo: '',
  gdDate: '',
  gdTime: '',
  typeOfInformation: '',
  placeDistanceDirection: '',
  beatNo: '',
  placeAddress: '',
  placeAreaMandal: '',
  placeStreetVillage: '',
  placeCityDistrict: '',
  placeState: '',
  placePIN: '',
  complainantName: '',
  complainantFatherHusbandName: '',
  complainantDOB: '',
  complainantAge: '',
  complainantNationality: '',
  complainantCaste: '',
  complainantPassportNo: '',
  complainantOccupation: '',
  complainantMobile: '',
  complainantAddress: '',
  accusedDetails: '',
  delayReasons: '',
  stolenProperties: '',
  totalValueStolen: '',
  inquestReport: '',
  complaintContents: '',
};

export default function App() {
  const [firData, setFirData] = useState<FIRData>(INITIAL_FIR);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Namaste. I am Raksha, your legal assistant. I am here to help you draft an FIR. Please tell me, what happened?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedFirs, setSavedFirs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState<string>('');
  const { isListening, transcript, startListening, stopListening, speak, isSpeaking, currentSpeechCharIndex, clearTranscript } = useSpeech();
  const lastProcessedTranscript = useRef('');

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Limit history to last 10 messages to prevent token limit issues
      const history = messages.slice(-10).concat(userMessage).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const result = await processChatMessage(history, firData);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (result.extractedData) {
        setFirData(prev => {
          const newData = { ...prev };
          Object.entries(result.extractedData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              (newData as any)[key] = value;
            }
          });
          return newData;
        });
      }

      if (result.missingFields) {
        setMissingFields(result.missingFields);
      }

      if (result.nextStep) {
        setNextStep(result.nextStep);
      }

      // Auto-speak the response
      speak(result.message);

    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = error instanceof AIError 
        ? error.message 
        : "I apologize, I encountered an unexpected error. Please try again.";
        
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      }]);
      
      // Also speak the error message so the user knows what happened
      speak(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, firData, speak]);

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript.current) {
      lastProcessedTranscript.current = transcript;
      const currentTranscript = transcript;
      clearTranscript();
      
      const lowerTranscript = currentTranscript.toLowerCase();
      if (lowerTranscript.includes('export fir') || lowerTranscript.includes('generate pdf')) {
        generateFIRPDF(firData);
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I've generated your FIR PDF based on your voice command.",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        speak(assistantMessage.content);
      } else {
        handleSendMessage(currentTranscript);
      }
    }
  }, [transcript, firData, handleSendMessage, speak, clearTranscript]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];
          const extracted = await processOCR(base64);
          setFirData(prev => ({ ...prev, ...extracted }));
          
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I've extracted your details from the document. Please verify them in the preview on the right.",
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          speak(assistantMessage.content);
        } catch (error) {
          console.error("OCR processing error:", error);
          const errorMessage = error instanceof AIError 
            ? error.message 
            : "I apologize, I had trouble reading that document. Please try a clearer photo or enter details manually.";
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: Date.now(),
          }]);
          speak(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFirData({
      ...INITIAL_FIR,
      firNo: generateRandomFIR()
    });
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: "Namaste. I am Raksha, your legal assistant. I am here to help you draft an FIR. Please tell me, what happened?",
      timestamp: Date.now(),
    }]);
    setMissingFields([]);
    setNextStep('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('lekhak_user', JSON.stringify(userData));
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      setLoginError('Connection error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lekhak_user');
    setShowHistory(false);
  };

  const saveToDb = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/firs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firNo: firData.firNo, data: firData, userId: user.id })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        if (result.message) {
          alert(result.message);
        } else {
          alert("FIR saved successfully to local database.");
          fetchSavedFirs();
        }
      } else {
        // Handle duplicate error or other server-side errors
        alert(result.error || "Failed to save FIR. Please try again.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("A connection error occurred. Please check your network.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchSavedFirs = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/firs?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSavedFirs(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('lekhak_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedFirs();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        >
          <div className="p-8 bg-primary text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Raksha Admin</h1>
            <p className="text-primary-soft text-sm mt-2">Secure Legal Assistant Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                {loginError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Access Portal
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-400">Default Credentials: admin / admin123</p>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const filteredFirs = savedFirs.filter(record => {
    const matchesSearch = 
      (record.fir_no?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (record.data.complainantName?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const recordDate = new Date(record.created_at);
    const matchesStartDate = !filterStartDate || recordDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || recordDate <= new Date(filterEndDate + 'T23:59:59');
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Scale className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Raksha</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary rounded-lg text-sm font-bold hover:bg-primary-border transition-colors border border-primary-border"
          >
            <History className="w-4 h-4" />
            {showHistory ? "Back to Editor" : "Saved Records"}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors border border-gray-200"
          >
            New FIR
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-[1600px] mx-auto w-full overflow-hidden">
        {showHistory ? (
          <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DbIcon className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-gray-900">Local SQLite Records</h2>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{filteredFirs.length} records found</p>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by FIR # or Complainant Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row gap-4 items-center"
                  >
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <input 
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="flex-1 md:w-40 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <span className="text-gray-400 hidden md:inline">to</span>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <input 
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="flex-1 md:w-40 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {(filterStartDate || filterEndDate) && (
                      <button 
                        onClick={() => {
                          setFilterStartDate('');
                          setFilterEndDate('');
                        }}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Clear Dates
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFirs.map((record) => (
                  <motion.div 
                    key={record.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 border border-gray-100 rounded-xl bg-gray-50 hover:border-primary-border transition-all group cursor-pointer"
                    onClick={() => {
                      setFirData(record.data);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-primary-soft text-primary text-[10px] font-bold rounded uppercase">
                        FIR #{record.fir_no}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 truncate">{record.data.complainantName || "Unnamed Complainant"}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{record.data.complaintContents || "No statement provided"}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button className="text-xs font-bold text-primary hover:underline">Load Record</button>
                    </div>
                  </motion.div>
                ))}
                {filteredFirs.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">No records found matching your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Section */}
            <div className="flex-1 min-w-0 h-[calc(100vh-160px)]">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isListening={isListening}
                onToggleMic={() => isListening ? stopListening() : startListening()}
                isLoading={isLoading}
                onFileUpload={handleFileUpload}
                nextStep={nextStep}
                missingFields={missingFields}
                isSpeaking={isSpeaking}
                currentSpeechCharIndex={currentSpeechCharIndex}
                transcript={transcript}
              />
            </div>

            {/* Preview Section */}
            <div className="w-full md:w-[450px] lg:w-[550px] h-[calc(100vh-160px)] shrink-0 flex flex-col gap-4">
              <div className="flex-1 overflow-hidden">
                <FIRPreview data={firData} />
              </div>
              <button 
                onClick={saveToDb}
                disabled={isSaving}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save to Local Database
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer / Status */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 text-[10px] text-gray-400 flex justify-between items-center">
        <div>© 2026 Raksha - Digital Legal Empowerment</div>
        <div className="flex gap-4">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Legal Disclaimer</span>
        </div>
      </footer>
    </div>
  );
}
