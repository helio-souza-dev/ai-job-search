import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [view, setView] = useState('tracker'); // 'tracker' or 'search'
  const [trackedJobs, setTrackedJobs] = useState([]);
  const [searchResults, setSearchResults] = useState(() => {
    const saved = localStorage.getItem('ai_job_search_results');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchQuery, setSearchQuery] = useState('Estágio em Desenvolvimento de Software');
  const [searchLocation, setSearchLocation] = useState('São Paulo, SP');
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJobFolder, setSelectedJobFolder] = useState('');
  const [pdfVersions, setPdfVersions] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState('');

  useEffect(() => {
    if (view === 'tracker') {
      fetchTracker();
    }
  }, [view]);

  useEffect(() => {
    localStorage.setItem('ai_job_search_results', JSON.stringify(searchResults));
  }, [searchResults]);

  const fetchTracker = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/tracker');
      const data = await res.json();
      setTrackedJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openPdfViewer = async (job) => {
    const folderName = `${job.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${job.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    setSelectedJobFolder(folderName);
    setModalOpen(true);
    setPdfVersions([]);
    setSelectedPdf('');
    
    try {
      const res = await fetch(`http://localhost:3001/api/cv-versions/${folderName}`);
      const data = await res.json();
      if (data && data.length > 0) {
         setPdfVersions(data);
         setSelectedPdf(data[0]); // O mais recente (já vem revertido do backend)
      }
    } catch(err) {
       console.error(err);
    }
  };

  const handleApply = async (job) => {
    setApplyLoading(job.id);
    try {
      const res = await fetch('http://localhost:3001/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: job.company, title: job.title, url: job.url })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Currículo gerado com sucesso!');
        // Remove a vaga da lista de busca no frontend e atualiza o funil instantaneamente
        setSearchResults(prev => prev.filter(j => j.url !== job.url));
        fetchTracker(); 
        setView('tracker'); 
      } else {
        alert('Erro: ' + (data.error || 'Falha ao gerar o currículo'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor backend.');
    }
    setApplyLoading(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, location: searchLocation, limit: 10 })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
         setSearchResults(data);
      } else {
         console.error('Unexpected response:', data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Job Dashboard</h1>
        <div className="nav-buttons">
          <button 
            className={`btn ${view === 'tracker' ? 'primary' : ''}`}
            onClick={() => setView('tracker')}
          >
            Aplicações
          </button>
          <button 
            className={`btn ${view === 'search' ? 'primary' : ''}`}
            onClick={() => setView('search')}
          >
            Buscar Vagas
          </button>
        </div>
      </header>

      <main>
        {view === 'tracker' && (
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Meu Funil de Vagas</h2>
            {trackedJobs.length === 0 ? (
              <p className="loading" style={{animation: 'none'}}>Nenhuma aplicação rastreada ainda.</p>
            ) : (
              <div className="tracker-grid">
                {trackedJobs.map((job, i) => (
                  <div key={i} className="job-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3>{job.role}</h3>
                    <div className="company">{job.company} • {job.sector}</div>
                    <span className={`status-badge status-${job.status === 'applied' ? 'applied' : job.status === 'interview' ? 'interview' : 'rejected'}`}>
                      {job.status}
                    </span>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {job.notes}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                       <button 
                         className="btn primary" 
                         onClick={() => handleApply({company: job.company, title: job.role, url: job.source, id: 'track_'+i})}
                         disabled={applyLoading === 'track_'+i}
                       >
                         {applyLoading === 'track_'+i ? 'Gerando...' : '✨ Gerar Currículo'}
                       </button>
                       <button 
                         className="btn" 
                         onClick={() => openPdfViewer(job)}
                       >
                         Visualizar PDFs
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'search' && (
          <div className="glass-panel">
            <form className="search-form" onSubmit={handleSearch}>
              <input 
                type="text" 
                className="search-input" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Desenvolvedor Front-end" 
              />
              <input 
                type="text" 
                className="search-input" 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Ex: São Paulo, Brasil" 
                style={{ flex: 0.5 }}
              />
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Buscando...' : 'Pesquisar'}
              </button>
            </form>

            {loading && <div className="loading">Agente de IA está extraindo as vagas...</div>}
            
            {!loading && searchResults.length > 0 && (
              <div className="tracker-grid">
                {searchResults.map((job, i) => (
                  <div key={i} className="job-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{fontSize: '1.1rem'}}>{job.title}</h3>
                    <div className="company">{job.company} • {job.location}</div>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                       <button 
                         className="btn primary" 
                         onClick={() => handleApply(job)}
                         disabled={applyLoading === job.id}
                       >
                         {applyLoading === job.id ? 'Gerando Currículo (IA)...' : '✨ Gerar Currículo e Aplicar'}
                       </button>
                       <a href={job.url} target="_blank" rel="noreferrer" className="btn" style={{textAlign: 'center', textDecoration: 'none'}}>
                         Ver Vaga Original
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Visualizador de Currículo</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            {pdfVersions.length > 0 ? (
              <>
                <div className="version-selector">
                  <label>Versão:</label>
                  <select value={selectedPdf} onChange={(e) => setSelectedPdf(e.target.value)}>
                    {pdfVersions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <a 
                    href={`http://localhost:3001/documents/applications/${selectedJobFolder}/${selectedPdf}`} 
                    download 
                    className="btn primary"
                    style={{marginLeft: 'auto'}}
                  >
                    Baixar PDF
                  </a>
                </div>
                <div className="pdf-viewer">
                  <iframe 
                    src={`http://localhost:3001/documents/applications/${selectedJobFolder}/${selectedPdf}#view=FitH`} 
                    width="100%"
                    height="100%"
                    title="PDF Viewer"
                  />
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>
                <p>Nenhuma versão de currículo encontrada para esta vaga.</p>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Clique em "Gerar Currículo" no card da vaga para criar um novo.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
