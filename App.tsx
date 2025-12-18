import React, { useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Link as LinkIcon } from 'lucide-react';
import { ShortLink } from './types';
import { LinkCard } from './components/LinkCard';
import { LinkModal } from './components/LinkModal';
import { SettingsModal } from './components/SettingsModal';
import { Header } from './components/Header';
import { useAppState } from './hooks/useAppState';
import "./index.css"

const App: React.FC = () => {
  const { links, settings, loading, saveLink, deleteLink, saveSettings } = useAppState();
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSaveLink = async (linkData: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>) => {
    const success = await saveLink(linkData, editingLink?.id);
    if (success) {
      setIsLinkModalOpen(false);
      setEditingLink(undefined);
    }
  };

  const handleDeleteLink = (id: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      deleteLink(id);
    }
  };

  const handleEditLink = (link: ShortLink) => {
    setEditingLink(link);
    setIsLinkModalOpen(true);
  };

  const filteredLinks = links.filter(link => 
    link.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
    link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCreate={() => { setEditingLink(undefined); setIsLinkModalOpen(true); }}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-200">
            My Shortlinks <span className="text-slate-500 text-sm font-normal ml-2">({filteredLinks.length})</span>
          </h2>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <div className="mx-auto w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-500">
              <LinkIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No links found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating your first shortlink for your portfolio.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
              >
                <Plus className="w-4 h-4" />
                Create First Link
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {filteredLinks.map(link => (
              <LinkCard 
                key={link.id} 
                link={link} 
                baseUrl={settings.baseUrl} 
                onEdit={handleEditLink}
                onDelete={handleDeleteLink}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => { setEditingLink(undefined); setIsLinkModalOpen(true); }}
        className="sm:hidden fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-xl shadow-primary-900/40 z-30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {isLinkModalOpen && (
        <LinkModal 
          isOpen={isLinkModalOpen} 
          onClose={() => { setIsLinkModalOpen(false); setEditingLink(undefined); }} 
          onSave={handleSaveLink} 
          initialData={editingLink}
          baseUrl={settings.baseUrl}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
          onSave={async (newSettings) => {
            const success = await saveSettings(newSettings);
            if (success) setIsSettingsModalOpen(false);
          }} 
          initialSettings={settings}
        />
      )}
    </div>
  );
};

export default App;