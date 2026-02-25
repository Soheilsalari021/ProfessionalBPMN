import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import BpmnEditor from './components/BpmnEditor';
import RequirementsPage from './components/RequirementsPage';
import TutorialPage from './components/TutorialPage';
import SgxConverter from './components/SgxConverter';
import BpmnTranslator from './components/BpmnTranslator';

function App() {
  /* 
   * Initialize state from localStorage if available 
   * This ensures the user doesn't lose progress on refresh
   */
  const [xml, setXml] = useState(() => {
    return localStorage.getItem('bpmn_autosave_xml') || null;
  });
  const [filename, setFilename] = useState(() => {
    return localStorage.getItem('bpmn_autosave_filename') || 'diagram.bpmn';
  });

  // State for the new Interactive Requirements Page
  const [showRequirements, setShowRequirements] = useState(false);
  // State for Tutorial Page
  const [showTutorial, setShowTutorial] = useState(false);
  // State for SGX Converter Page
  const [showSgxConverter, setShowSgxConverter] = useState(false);
  // State for BPMN Translator Page
  const [showTranslator, setShowTranslator] = useState(false);

  /*
   * Save to localStorage whenever state changes
   */
  React.useEffect(() => {
    if (xml) {
      localStorage.setItem('bpmn_autosave_xml', xml);
    } else {
      localStorage.removeItem('bpmn_autosave_xml');
    }
  }, [xml]);

  React.useEffect(() => {
    if (filename) {
      localStorage.setItem('bpmn_autosave_filename', filename);
    }
  }, [filename]);

  const handleFileLoaded = (xmlContent, fileName) => {
    setXml(xmlContent);
    setFilename(fileName || 'diagram.bpmn');
  };

  const handleClearState = () => {
    setXml(null);
    setFilename('diagram.bpmn');
    localStorage.removeItem('bpmn_autosave_xml');
    localStorage.removeItem('bpmn_autosave_filename');
  };

  const handleRequirementsGenerated = (generatedXml, generatedFilename) => {
    setXml(generatedXml);
    setFilename(generatedFilename);
    setShowRequirements(false); // Close the builder, show the editor (implied by xml being set)
  };

  // 1. If Tutorial is active, show it full screen
  if (showTutorial) {
    return <TutorialPage onBack={() => setShowTutorial(false)} />;
  }

  // 2. If Requirements Builder is active, show it full screen
  if (showRequirements) {
    return (
      <RequirementsPage
        onBack={() => setShowRequirements(false)}
        onGenerate={handleRequirementsGenerated}
      />
    );
  }

  // 3. If SGX Converter is active, show it full screen
  if (showSgxConverter) {
    return <SgxConverter onBack={() => setShowSgxConverter(false)} />;
  }

  // 4. If BPMN Translator is active, show it full screen
  if (showTranslator) {
    return <BpmnTranslator onBack={() => setShowTranslator(false)} />;
  }

  // 5. Main App Render (Home or Editor)
  return (
    <div className={`h-screen w-screen flex flex-col bg-gray-900 text-gray-100 ${xml ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
      {/* Navbar */}
      <nav className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300 px-8 py-4 flex items-center justify-between
        ${xml ? 'bg-gray-950 border-b border-gray-800 shadow-md relative' : 'bg-transparent backdrop-blur-[2px]'}
      `}>
        {/* Logo Section */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => {
            if (xml) {
              if (window.confirm('Return to home? Unsaved changes will be lost.')) {
                handleClearState();
              }
            } else {
              handleClearState();
            }
          }}
          title="Back to Home"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <img src="/logo.svg" alt="App Logo" className="h-10 w-10 relative z-10 transform group-hover:rotate-90 transition-transform duration-700" />
          </div>
          <span className="text-2xl font-bold tracking-wider text-white group-hover:text-emerald-400 transition-colors">
            NIGHT<span className="text-emerald-400 font-light">BPMN</span>
          </span>
        </div>

        {/* Nav Links (Visible only on Start Page) */}
        {!xml && (
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setShowRequirements(true)}
              className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              Requirements Builder
            </button>
            <button
              onClick={() => setShowSgxConverter(true)}
              className="text-sm font-medium text-gray-300 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              SGX Converter
            </button>
            <button
              onClick={() => setShowTranslator(true)}
              className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              Translator
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-sm font-bold bg-emerald-500 text-gray-900 px-6 py-2 rounded-full hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all transform hover:-translate-y-0.5"
            >
              GET STARTED
            </button>
          </div>
        )}
      </nav>

      <main className="flex-grow relative h-full w-full">
        {!xml ? (
          <FileUpload
            onFileLoaded={handleFileLoaded}
            onShowTutorial={() => setShowTutorial(true)}
            onShowRequirements={() => setShowRequirements(true)}
            onShowSgxConverter={() => setShowSgxConverter(true)}
            onShowTranslator={() => setShowTranslator(true)}
          />
        ) : (
          <BpmnEditor xml={xml} filename={filename} onFilenameChange={setFilename} />
        )}
      </main>
    </div>
  );
}

export default App;
