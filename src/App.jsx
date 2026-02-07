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
    <div className="h-screen w-screen flex flex-col bg-white">
      <header className="bg-gray-800 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-bold">BPMN Editor</h1>
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
