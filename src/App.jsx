import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import BpmnEditor from './components/BpmnEditor';

function App() {
  const [xml, setXml] = useState(null);
  const [filename, setFilename] = useState('diagram.bpmn');

  const handleFileLoaded = (xmlContent, fileName) => {
    setXml(xmlContent);
    setFilename(fileName || 'diagram.bpmn');
  };

  return (
    // Haupt-Layout der Anwendung: Header und Inhaltsbereich
    // Main layout: Header and content area
    <div className="h-screen w-screen flex flex-col bg-white">
      <header className="bg-gray-800 text-white p-4 shadow-md z-10 flex items-center">
        <div
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            if (xml) {
              if (window.confirm('Are you sure you want to go back to home? Unsaved changes will be lost.')) {
                setXml(null);
                setFilename('diagram.bpmn');
              }
            } else {
              setXml(null);
              setFilename('diagram.bpmn');
            }
          }}
          title="Go to Start Page"
        >
          <img src="/logo.svg" alt="App Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold">BPMN Editor</h1>
        </div>
      </header>
      <main className="flex-grow overflow-hidden relative">
        {!xml ? (
          <FileUpload onFileLoaded={handleFileLoaded} />
        ) : (
          <BpmnEditor xml={xml} filename={filename} onFilenameChange={setFilename} />
        )}
      </main>
    </div>
  );
}

export default App;
