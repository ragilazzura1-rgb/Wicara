import React, { useState, useEffect, useMemo } from 'react';
import { Mic, Plus, FileText, RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { TranscriptEditor } from './components/TranscriptEditor';
import { ConversationPlayerDock } from './components/ConversationPlayerDock';
import { ProjectsManager } from './components/ProjectsManager';
import { VoiceCatalogView } from './components/VoiceCatalogView';
import { AudioHistoryView } from './components/AudioHistoryView';
import { SpeakerConfigModal } from './components/SpeakerConfigModal';
import { TranscriptImportModal } from './components/TranscriptImportModal';
import { HelpModal } from './components/HelpModal';
import {
  InterviewProject,
  Speaker,
  TranscriptTurn,
  TTSMode,
  AudioHistoryItem,
} from './types';
import { StorageService, DEFAULT_PROJECTS } from './services/storage';
import { TTSService } from './services/ttsService';
import { downloadBlob } from './services/audioUtils';
import { getVoiceById } from './services/voiceCatalog';
import { autoEnrichVerbatim } from './services/verbatimEngine';
import { WelcomeView } from './components/WelcomeView';
import { NotebookLMOverviewModal } from './components/NotebookLMOverviewModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'welcome' | 'studio' | 'projects' | 'voices' | 'history'>('welcome');

  // Persistence State
  const [projects, setProjects] = useState<InterviewProject[]>(() => StorageService.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => StorageService.getActiveProjectId());
  const [ttsMode, setTTSModeState] = useState<TTSMode>(() => StorageService.getTTSMode());
  const [historyItems, setHistoryItems] = useState<AudioHistoryItem[]>(() => StorageService.getAudioHistory());

  // Modals
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isNotebookLMModalOpen, setIsNotebookLMModalOpen] = useState(false);

  // Playback & Conversation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);

  // Rendering & Export State
  const [isRenderingAll, setIsRenderingAll] = useState(false);
  const [renderProgress, setRenderProgress] = useState<{ current: number; total: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Project Reference
  const currentProject = useMemo(() => {
    const found = projects.find((p) => p.id === activeProjectId);
    return found || projects[0] || null;
  }, [projects, activeProjectId]);

  // Turn speaker dictionary for O(1) lookups
  const speakersDict = useMemo(() => {
    if (!currentProject) return {};
    return currentProject.speakers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, Speaker>);
  }, [currentProject]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handlePauseConversation();
        } else {
          handlePlayConversation();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddTurn();
        showToast('Giliran bicara baru ditambahkan.');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImportModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport('wav');
        showToast('Mengekspor percakapan audio...');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentProject) {
          StorageService.saveProjects(projects);
          showToast('Proyek berhasil disimpan ke penyimpanan lokal.');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        handleClearAllTurns();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('welcome');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('studio');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setActiveTab('projects');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault();
        setActiveTab('voices');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '5') {
        e.preventDefault();
        setActiveTab('history');
      } else if (e.key === 'Escape') {
        if (isPlaying) {
          handleStopConversation();
        }
        setIsImportModalOpen(false);
        setEditingSpeaker(null);
        setIsHelpModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentProject]);

  // Save projects to storage whenever updated
  const updateProject = (updated: InterviewProject) => {
    const updatedList = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedList);
    StorageService.saveProjects(updatedList);
  };

  const handleAutoEnrich = (style: 'podcast' | 'formal' | 'investigative' | 'naturalizer' = 'podcast') => {
    if (!currentProject) {
      handleCreateProject();
      return;
    }
    if (currentProject.turns.length === 0) {
      showToast('Tambahkan atau impor giliran terlebih dahulu untuk diperkaya.');
      return;
    }
    const enrichedTurns = autoEnrichVerbatim(currentProject.turns, style);
    updateProject({
      ...currentProject,
      turns: enrichedTurns,
      updatedAt: Date.now(),
    });
    const label =
      style === 'naturalizer'
        ? 'Jeda bernapas alami berhasil disisipkan'
        : `Percakapan berhasil diperkaya dengan gaya ${style}`;
    showToast(`${label}!`);
  };

  const handleSetTTSMode = (mode: TTSMode) => {
    setTTSModeState(mode);
    StorageService.setTTSMode(mode);
    showToast(
      mode === 'gemini'
        ? 'Mode Gemini AI Studio aktif (Kualitas vokal tinggi)'
        : 'Mode Offline aktif (Web Audio + Web Speech API)'
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Play conversation from current turn or start
  const handlePlayConversation = async () => {
    if (!currentProject || currentProject.turns.length === 0) return;
    const startIndex = activeTurnIndex !== null && activeTurnIndex < currentProject.turns.length ? activeTurnIndex : 0;

    setIsPlaying(true);
    await TTSService.playConversation(
      currentProject.turns,
      speakersDict,
      startIndex,
      {
        onTurnStart: (idx) => {
          setActiveTurnIndex(idx);
        },
        onTurnEnd: () => {},
        onComplete: () => {
          setIsPlaying(false);
          setActiveTurnIndex(null);
        },
        onError: (err) => {
          console.error(err);
          setIsPlaying(false);
          showToast('Terjadi kendala pemutaran. Beralih ke mesin offline.');
        },
      },
      ttsMode
    );
  };

  const handlePauseConversation = () => {
    TTSService.stopPlayback();
    setIsPlaying(false);
  };

  const handleStopConversation = () => {
    TTSService.stopPlayback();
    setIsPlaying(false);
    setActiveTurnIndex(null);
  };

  // Play single turn
  const handlePlaySingleTurn = async (turnIndex: number) => {
    if (!currentProject) return;
    const turn = currentProject.turns[turnIndex];
    const speaker = speakersDict[turn.speakerId] || Object.values(speakersDict)[0];

    if (activeTurnIndex === turnIndex && isPlaying) {
      handlePauseConversation();
      return;
    }

    TTSService.stopPlayback();
    setIsPlaying(true);
    setActiveTurnIndex(turnIndex);

    try {
      let audioBase64 = turn.audioBase64;
      let isCloud = turn.isCloudAudio;
      if (!audioBase64) {
        const res = await TTSService.synthesizeTurn(turn, speaker, ttsMode);
        audioBase64 = res.audioBase64;
        isCloud = res.isCloudAudio;
        const updatedTurns = [...currentProject.turns];
        updatedTurns[turnIndex] = {
          ...turn,
          audioBase64: res.audioBase64,
          audioDuration: res.duration,
          isCloudAudio: isCloud,
          status: 'ready',
        };
        updateProject({ ...currentProject, turns: updatedTurns });
      }

      if (isCloud && audioBase64) {
        await TTSService.playBase64Audio(audioBase64);
      } else if ('speechSynthesis' in window) {
        const voiceModel = getVoiceById(speaker.voiceModelId);
        const rate = turn.pacingOverride?.rate ?? speaker.pacing.rate ?? 1.0;
        const pitch = turn.pacingOverride?.pitch ?? speaker.pacing.pitch ?? 1.0;
        await TTSService.speakWithWebSpeech(turn.text, voiceModel, rate, pitch, speaker.systemVoiceURI);
      } else if (audioBase64) {
        await TTSService.playBase64Audio(audioBase64);
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memutar giliran bicara.');
    } finally {
      setIsPlaying(false);
    }
  };

  // Turn management
  const handleUpdateTurn = (index: number, updated: TranscriptTurn) => {
    if (!currentProject) return;
    const updatedTurns = [...currentProject.turns];
    updatedTurns[index] = updated;
    updateProject({ ...currentProject, turns: updatedTurns, updatedAt: Date.now() });
  };

  const handleDeleteTurn = (index: number) => {
    if (!currentProject) return;
    const updatedTurns = currentProject.turns.filter((_, i) => i !== index);
    updateProject({ ...currentProject, turns: updatedTurns, updatedAt: Date.now() });
  };

  const handleDuplicateTurn = (index: number) => {
    if (!currentProject) return;
    const sourceTurn = currentProject.turns[index];
    if (!sourceTurn) return;
    const newTurn: TranscriptTurn = {
      ...sourceTurn,
      id: 'turn-' + Date.now(),
      audioBase64: undefined,
      status: 'idle',
    };
    const updatedTurns = [...currentProject.turns];
    updatedTurns.splice(index + 1, 0, newTurn);
    updateProject({ ...currentProject, turns: updatedTurns, updatedAt: Date.now() });
    showToast('Giliran berhasil digandakan.');
  };

  const handleClearAllTurns = () => {
    if (!currentProject) return;
    updateProject({ ...currentProject, turns: [], updatedAt: Date.now() });
    showToast('Semua giliran transkrip telah dibersihkan.');
  };

  const handleDeleteSpeaker = (speakerId: string) => {
    if (!currentProject) return;
    if (currentProject.speakers.length <= 1) {
      showToast('Proyek minimal harus memiliki 1 pembicara.');
      return;
    }
    const remainingSpeakers = currentProject.speakers.filter((s) => s.id !== speakerId);
    const fallbackSpeakerId = remainingSpeakers[0].id;
    // Reassign turns that belonged to deleted speaker to the first remaining speaker
    const updatedTurns = currentProject.turns.map((t) =>
      t.speakerId === speakerId ? { ...t, speakerId: fallbackSpeakerId, audioBase64: undefined, status: 'idle' as const } : t
    );
    updateProject({
      ...currentProject,
      speakers: remainingSpeakers,
      turns: updatedTurns,
      updatedAt: Date.now(),
    });
    showToast('Pembicara berhasil dihapus dan gilirannya dialihkan.');
    setEditingSpeaker(null);
  };

  const handleAddTurn = (speakerId?: string) => {
    if (!currentProject) {
      handleCreateProject();
      return;
    }
    const defaultSpeakerId = speakerId || currentProject.speakers[0]?.id || 'spk-1';
    const newTurn: TranscriptTurn = {
      id: 'turn-' + Date.now(),
      speakerId: defaultSpeakerId,
      text: '',
      status: 'idle',
    };
    const updatedTurns = [...currentProject.turns, newTurn];
    updateProject({ ...currentProject, turns: updatedTurns, updatedAt: Date.now() });
  };

  const handleMoveTurn = (fromIndex: number, toIndex: number) => {
    if (!currentProject) return;
    const updatedTurns = [...currentProject.turns];
    const [moved] = updatedTurns.splice(fromIndex, 1);
    updatedTurns.splice(toIndex, 0, moved);
    updateProject({ ...currentProject, turns: updatedTurns, updatedAt: Date.now() });
  };

  // Speaker Config Save
  const handleSaveSpeaker = (updatedSpeaker: Speaker) => {
    if (!currentProject) return;
    const updatedSpeakers = currentProject.speakers.map((s) =>
      s.id === updatedSpeaker.id ? updatedSpeaker : s
    );
    // Invalidate cached audio for this speaker because voice/pacing changed
    const updatedTurns = currentProject.turns.map((t) =>
      t.speakerId === updatedSpeaker.id ? { ...t, audioBase64: undefined, status: 'idle' as const } : t
    );
    updateProject({
      ...currentProject,
      speakers: updatedSpeakers,
      turns: updatedTurns,
      updatedAt: Date.now(),
    });
    const turnsCount = currentProject.turns.filter((t) => t.speakerId === updatedSpeaker.id).length;
    showToast(`Pengaturan & nama pembicara "${updatedSpeaker.name}" diterapkan ke ${turnsCount} giliran.`);
  };

  // Bulk rename speaker across all associated turns
  const handleBulkRenameSpeaker = (speakerId: string, newName: string) => {
    if (!currentProject) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updatedSpeakers = currentProject.speakers.map((s) =>
      s.id === speakerId ? { ...s, name: trimmed } : s
    );
    updateProject({
      ...currentProject,
      speakers: updatedSpeakers,
      updatedAt: Date.now(),
    });
    const turnsCount = currentProject.turns.filter((t) => t.speakerId === speakerId).length;
    showToast(`Nama pembicara berhasil diperbarui menjadi "${trimmed}" pada ${turnsCount} giliran.`);
  };

  // Add new speaker to project
  const handleAddSpeaker = () => {
    if (!currentProject) return;
    const newId = 'spk-' + Date.now();
    const newSpeaker: Speaker = {
      id: newId,
      name: `Pembicara ${currentProject.speakers.length + 1}`,
      voiceModelId: 'dimas-pratama',
      color: '#ea580c',
      role: 'Narasumber Tambahan',
      pacing: {
        rate: 1.0,
        pitch: 1.0,
        pauseAfter: 0.4,
        volume: 1.0,
      },
    };
    updateProject({
      ...currentProject,
      speakers: [...currentProject.speakers, newSpeaker],
      updatedAt: Date.now(),
    });
    setEditingSpeaker(newSpeaker);
  };

  // Import parsed turns with analyzed speakers (auto-creates project if zero projects exist)
  const handleImportTranscript = (
    importedTurns: TranscriptTurn[],
    newSpeakers: Speaker[],
    replaceAll = false,
    newTitle?: string
  ) => {
    if (!currentProject) {
      const newId = 'proj-' + Date.now();
      const defaultSpeakers: Speaker[] = [
        {
          id: 'spk-1',
          name: 'Pewawancara',
          voiceModelId: 'siti-rahma',
          color: '#e11d48',
          role: 'Host',
          pacing: { rate: 1.0, pitch: 1.0, pauseAfter: 0.45, volume: 1.0 },
        },
        {
          id: 'spk-2',
          name: 'Narasumber',
          voiceModelId: 'budi-santoso',
          color: '#059669',
          role: 'Narasumber',
          pacing: { rate: 1.0, pitch: 0.95, pauseAfter: 0.5, volume: 1.0 },
        },
      ];

      const newProj: InterviewProject = {
        id: newId,
        title: newTitle || 'Wawancara Impor Baru',
        description: 'Naskah hasil analisis dan impor otomatis.',
        category: 'kustom',
        tags: ['Wawancara', 'Impor'],
        speakers: newSpeakers.length > 0 ? newSpeakers : defaultSpeakers,
        turns: importedTurns,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedList = [newProj, ...projects];
      setProjects(updatedList);
      StorageService.saveProjects(updatedList);
      setActiveProjectId(newId);
      StorageService.setActiveProjectId(newId);
      setActiveTab('studio');
      showToast(
        `Berhasil membuat proyek baru dengan ${newProj.speakers.length} aktor dan ${importedTurns.length} percakapan!`
      );
      return;
    }

    // Merge new speakers with existing speakers
    const existingIds = new Set(currentProject.speakers.map((s) => s.id));
    const mergedSpeakers = [...currentProject.speakers];
    newSpeakers.forEach((spk) => {
      if (!existingIds.has(spk.id)) {
        mergedSpeakers.push(spk);
      }
    });

    const finalTurns = replaceAll
      ? importedTurns
      : [...currentProject.turns, ...importedTurns];

    updateProject({
      ...currentProject,
      title: newTitle && (replaceAll || currentProject.turns.length === 0) ? newTitle : currentProject.title,
      speakers: mergedSpeakers,
      turns: finalTurns,
      updatedAt: Date.now(),
    });

    showToast(
      `Berhasil menganalisa & mengimpor ${newSpeakers.length} aktor dan ${importedTurns.length} percakapan!`
    );
  };

  // Pre-render all turns
  const handleRenderAll = async () => {
    if (!currentProject || currentProject.turns.length === 0) return;
    setIsRenderingAll(true);
    setRenderProgress({ current: 0, total: currentProject.turns.length });

    try {
      const renderedTurns = await TTSService.renderAllTurns(
        currentProject.turns,
        speakersDict,
        ttsMode,
        (current, total) => {
          setRenderProgress({ current, total });
        }
      );

      updateProject({ ...currentProject, turns: renderedTurns });
      showToast('Semua audio giliran percakapan berhasil diproses!');
    } catch (e) {
      console.error(e);
      showToast('Gagal menyelesaikan render otomatis.');
    } finally {
      setIsRenderingAll(false);
      setRenderProgress(null);
    }
  };

  // Export full conversation to chosen format
  const handleExport = async (format: 'wav' | 'mp3' | 'webm' | 'srt' | 'json') => {
    if (!currentProject) return;

    if (format === 'srt') {
      TTSService.exportSubtitles(currentProject.title, currentProject.turns, speakersDict);
      showToast('Subtitle .srt berhasil diunduh.');
      return;
    }

    if (format === 'json') {
      const dataStr = JSON.stringify(currentProject, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      downloadBlob(blob, `${currentProject.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.json`);
      showToast('Data proyek JSON berhasil diekspor.');
      return;
    }

    setIsExporting(true);
    try {
      const { blob, filename } = await TTSService.exportFullConversation(
        currentProject.title,
        currentProject.id,
        currentProject.turns,
        speakersDict,
        format,
        ttsMode
      );

      downloadBlob(blob, filename);
      setHistoryItems(StorageService.getAudioHistory());
      showToast(`Percakapan berhasil diekspor sebagai ${filename}!`);
    } catch (e) {
      console.error(e);
      showToast('Gagal mengekspor audio.');
    } finally {
      setIsExporting(false);
    }
  };

  // Project Management Actions
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    StorageService.setActiveProjectId(projectId);
    setActiveTab('studio');
    TTSService.stopPlayback();
    setIsPlaying(false);
    setActiveTurnIndex(null);
  };

  const handleCreateProject = (template?: InterviewProject) => {
    const newId = 'proj-' + Date.now();
    const newProj: InterviewProject = template
      ? {
          ...template,
          id: newId,
          title: template.title + ' (Salinan)',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          turns: template.turns.map((t) => ({ ...t, id: 't-' + Math.random(), audioBase64: undefined })),
        }
      : {
          id: newId,
          title: 'Wawancara Baru',
          description: 'Deskripsi proyek transkrip wawancara kustom Anda.',
          category: 'kustom',
          tags: ['Wawancara', 'Kustom'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          speakers: [
            {
              id: 'spk-1',
              name: 'Pewawancara',
              voiceModelId: 'siti-rahma',
              color: '#e11d48',
              role: 'Host',
              pacing: { rate: 1.0, pitch: 1.0, pauseAfter: 0.45, volume: 1.0 },
            },
            {
              id: 'spk-2',
              name: 'Narasumber',
              voiceModelId: 'budi-santoso',
              color: '#059669',
              role: 'Narasumber',
              pacing: { rate: 1.0, pitch: 0.95, pauseAfter: 0.5, volume: 1.0 },
            },
          ],
          turns: [], // Clean blank timeline
        };

    const updatedList = [newProj, ...projects];
    setProjects(updatedList);
    StorageService.saveProjects(updatedList);
    handleSelectProject(newId);
    showToast(`Proyek baru "${newProj.title}" berhasil dibuat dengan linimasa bersih.`);
  };

  const handleDuplicateProject = (project: InterviewProject) => {
    handleCreateProject(project);
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    StorageService.saveProjects(updated);
    if (activeProjectId === projectId) {
      if (updated.length > 0) {
        handleSelectProject(updated[0].id);
      } else {
        setActiveProjectId('');
        StorageService.setActiveProjectId('');
        TTSService.stopPlayback();
        setIsPlaying(false);
        setActiveTurnIndex(null);
      }
    }
    showToast('Proyek berhasil dihapus.');
  };

  const handleDeleteAllProjects = () => {
    setProjects([]);
    StorageService.saveProjects([]);
    setActiveProjectId('');
    StorageService.setActiveProjectId('');
    TTSService.stopPlayback();
    setIsPlaying(false);
    setActiveTurnIndex(null);
    showToast('Semua proyek berhasil dikosongkan.');
  };

  const handleRestoreDefaultTemplates = () => {
    setProjects(DEFAULT_PROJECTS);
    StorageService.saveProjects(DEFAULT_PROJECTS);
    if (DEFAULT_PROJECTS.length > 0) {
      handleSelectProject(DEFAULT_PROJECTS[0].id);
    }
    showToast('Template wawancara bawaan berhasil dipulihkan.');
  };

  const handleApplyPauseOptimization = (optimizedTurns: TranscriptTurn[]) => {
    if (!currentProject) return;
    updateProject({
      ...currentProject,
      turns: optimizedTurns,
      updatedAt: Date.now(),
    });
    showToast(`Optimasi ritme jeda cerdas berhasil diterapkan ke ${optimizedTurns.length} giliran!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl shadow-indigo-500/20 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ttsMode={ttsMode}
        setTTSMode={handleSetTTSMode}
        projectTitle={currentProject?.title || ''}
        onNewProject={() => handleCreateProject()}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 0: Welcome & Shortcuts Hub */}
        {activeTab === 'welcome' && (
          <WelcomeView
            onGoToStudio={() => setActiveTab('studio')}
            onNewProject={() => handleCreateProject()}
            onOpenImport={() => setIsImportModalOpen(true)}
            onGoToVoices={() => setActiveTab('voices')}
            onGoToHistory={() => setActiveTab('history')}
            onAutoEnrichCurrentProject={() => {
              handleAutoEnrich('podcast');
              setActiveTab('studio');
            }}
            currentProject={currentProject}
          />
        )}

        {/* Tab 1: Studio Workspace */}
        {activeTab === 'studio' && (
          currentProject ? (
            <TranscriptEditor
              turns={currentProject.turns}
              speakers={speakersDict}
              activeTurnIndex={activeTurnIndex}
              isPlaying={isPlaying}
              onPlayTurn={handlePlaySingleTurn}
              onUpdateTurn={handleUpdateTurn}
              onDeleteTurn={handleDeleteTurn}
              onDuplicateTurn={handleDuplicateTurn}
              onClearAllTurns={handleClearAllTurns}
              onAddTurn={handleAddTurn}
              onMoveTurn={handleMoveTurn}
              onOpenSpeakerConfig={(spk) => setEditingSpeaker(spk)}
              onDeleteSpeaker={handleDeleteSpeaker}
              onBulkRenameSpeaker={handleBulkRenameSpeaker}
              onDeleteCurrentProject={() => handleDeleteProject(currentProject.id)}
              onOpenImport={() => setIsImportModalOpen(true)}
              onAddSpeaker={handleAddSpeaker}
              onAutoEnrich={handleAutoEnrich}
              onApplyPauseOptimization={handleApplyPauseOptimization}
              onOpenNotebookLMOverview={() => setIsNotebookLMModalOpen(true)}
              ttsMode={ttsMode}
            />
          ) : (
            <div className="max-w-2xl mx-auto text-center py-20 px-6 bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-3xl space-y-4 animate-fade-in my-8 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center shadow-inner">
                <Mic className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Belum Ada Proyek Aktif di Studio</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Semua proyek telah dihapus. Anda dapat membuat proyek baru dari awal, mengimpor naskah wawancara, atau memulihkan template bawaan.
              </p>
              <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCreateProject()}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Proyek Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Impor Naskah Teks</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDefaultTemplates}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Pulihkan Template Bawaan</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Tab 2: Projects Management */}
        {activeTab === 'projects' && (
          <ProjectsManager
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onDeleteAllProjects={handleDeleteAllProjects}
            onRestoreDefaultTemplates={handleRestoreDefaultTemplates}
          />
        )}

        {/* Tab 3: Native Indonesian Voice Models (6 Voices) */}
        {activeTab === 'voices' && (
          <VoiceCatalogView
            ttsMode={ttsMode}
            onAssignToSpeaker={(voice) => {
              if (currentProject && currentProject.speakers[0]) {
                handleSaveSpeaker({
                  ...currentProject.speakers[0],
                  voiceModelId: voice.id,
                });
                setActiveTab('studio');
              }
            }}
          />
        )}

        {/* Tab 4: Audio History */}
        {activeTab === 'history' && (
          <AudioHistoryView
            historyItems={historyItems}
            onDeleteHistoryItem={(id) => {
              StorageService.deleteAudioHistoryItem(id);
              setHistoryItems(StorageService.getAudioHistory());
              showToast('Item berhasil dihapus dari riwayat.');
            }}
            onClearHistory={() => {
              StorageService.saveAudioHistory([]);
              setHistoryItems([]);
              showToast('Riwayat audio berhasil dikosongkan.');
            }}
          />
        )}
      </main>

      {/* Persistent Bottom Floating Player in Studio tab */}
      {activeTab === 'studio' && currentProject && (
        <ConversationPlayerDock
          turns={currentProject.turns}
          speakers={speakersDict}
          isPlaying={isPlaying}
          activeTurnIndex={activeTurnIndex}
          onPlay={handlePlayConversation}
          onPause={handlePauseConversation}
          onStop={handleStopConversation}
          onRenderAll={handleRenderAll}
          isRenderingAll={isRenderingAll}
          renderProgress={renderProgress}
          onExport={handleExport}
          ttsMode={ttsMode}
          isExporting={isExporting}
        />
      )}

      {/* Modals */}
      {editingSpeaker && (
        <SpeakerConfigModal
          speaker={editingSpeaker}
          isOpen={Boolean(editingSpeaker)}
          onClose={() => setEditingSpeaker(null)}
          onSave={handleSaveSpeaker}
          onDeleteSpeaker={handleDeleteSpeaker}
          canDelete={Boolean(currentProject && currentProject.speakers.length > 1)}
          associatedTurnsCount={currentProject ? currentProject.turns.filter((t) => t.speakerId === editingSpeaker.id).length : 0}
          ttsMode={ttsMode}
        />
      )}

      <TranscriptImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportTranscript}
        existingSpeakers={currentProject?.speakers || []}
      />

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      <NotebookLMOverviewModal
        isOpen={isNotebookLMModalOpen}
        onClose={() => setIsNotebookLMModalOpen(false)}
        turns={currentProject?.turns || []}
        speakers={speakersDict}
        projectTitle={currentProject?.title || 'Wawancara'}
      />
    </div>
  );
}
