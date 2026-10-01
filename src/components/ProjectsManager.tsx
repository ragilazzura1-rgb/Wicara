import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Calendar,
  MessageSquare,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  AlertTriangle,
  Check,
  Tag,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { InterviewProject } from '../types';
import { DEFAULT_PROJECTS } from '../services/storage';
import { getVoiceById } from '../services/voiceCatalog';
import { formatDuration } from '../services/audioUtils';

interface ProjectsManagerProps {
  projects: InterviewProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (template?: InterviewProject) => void;
  onDuplicateProject: (project: InterviewProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteAllProjects?: () => void;
  onRestoreDefaultTemplates?: () => void;
}

type SortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'turns-desc' | 'duration-desc';

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onDeleteAllProjects,
  onRestoreDefaultTemplates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Extract all unique tags across all projects
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t && t.trim()) tagSet.add(t.trim());
        });
      }
    });
    return Array.from(tagSet);
  }, [projects]);

  // Filter and Sort Projects
  const filteredAndSortedProjects = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const filtered = projects.filter((p) => {
      // Search matching across title, description, category, tags, and speaker names/roles
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query))) ||
        p.speakers.some(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            (s.role && s.role.toLowerCase().includes(query))
        );

      // Category filter matching
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // Tag filter matching
      const matchTag =
        selectedTag === 'all' || (Array.isArray(p.tags) && p.tags.includes(selectedTag));

      return matchQuery && matchCategory && matchTag;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'updated-desc') {
        return b.updatedAt - a.updatedAt;
      }
      if (sortBy === 'updated-asc') {
        return a.updatedAt - b.updatedAt;
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'id');
      }
      if (sortBy === 'turns-desc') {
        return b.turns.length - a.turns.length;
      }
      if (sortBy === 'duration-desc') {
        const getDur = (p: InterviewProject) =>
          p.turns.reduce((acc, t) => acc + (t.audioDuration || t.text.split(' ').length / 2.2), 0);
        return getDur(b) - getDur(a);
      }
      return 0;
    });
  }, [projects, searchTerm, selectedCategory, selectedTag, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTag('all');
    setSortBy('updated-desc');
  };

  const isFilteringActive = searchTerm.trim() !== '' || selectedCategory !== 'all' || selectedTag !== 'all';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-28 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Manajemen & Direktori Proyek Wawancara</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Organisasi & Kelola Semua Proyek Anda
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            Kelola, buat, atau hapus naskah wawancara Anda secara fleksibel. Anda dapat menghapus proyek satu per satu atau mengosongkan seluruh direktori.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onCreateProject()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Proyek Kosong Baru</span>
            </button>

            {projects.length > 0 && onDeleteAllProjects && (
              <div>
                {showDeleteAllConfirm ? (
                  <div className="flex items-center gap-2 p-1.5 bg-rose-950/80 border border-rose-800 rounded-xl animate-fade-in">
                    <span className="text-xs text-rose-200 font-medium px-2">Hapus SEMUA {projects.length} proyek?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAllProjects();
                        setShowDeleteAllConfirm(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Ya, Hapus Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteAllConfirm(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/80 text-xs font-semibold transition-all"
                    title="Kosongkan semua proyek"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Hapus Semua Proyek</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Search, Category & Tag Filter Bar (Rendered only when projects exist) */}
      {projects.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Row 1: Search Input & Sort Selector */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Live Search Input with Clear Button */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan judul, tag, pembicara, atau topik naskah..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-950 border border-slate-700/80 text-xs text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400 hidden sm:inline">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white font-semibold cursor-pointer focus:outline-none text-xs"
                >
                  <option value="updated-desc" className="bg-slate-900 text-white">Terakhir Diubah</option>
                  <option value="updated-asc" className="bg-slate-900 text-white">Paling Lama Diubah</option>
                  <option value="title-asc" className="bg-slate-900 text-white">Judul (A - Z)</option>
                  <option value="turns-desc" className="bg-slate-900 text-white">Jumlah Giliran Terbanyak</option>
                  <option value="duration-desc" className="bg-slate-900 text-white">Durasi Audio Terpanjang</option>
                </select>
              </div>

              {isFilteringActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 hover:text-white border border-slate-700 transition-colors"
                  title="Reset semua filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Category Filters & Tag Chips */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                <span>Kategori:</span>
              </span>
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'rekrutmen', label: 'Rekrutmen' },
                { id: 'podcast', label: 'Podcast' },
                { id: 'jurnalistik', label: 'Jurnalistik' },
                { id: 'kustom', label: 'Kustom' },
              ].map((cat) => {
                const count =
                  cat.id === 'all'
                    ? projects.length
                    : projects.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Tag Filter Chips (if any tags exist) */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-violet-400" />
                  <span>Tag:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedTag === 'all'
                      ? 'bg-violet-600/30 border border-violet-500 text-violet-200'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Semua Tag
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedTag === tag
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Menampilkan <strong>{filteredAndSortedProjects.length}</strong> dari{' '}
              <strong>{projects.length}</strong> proyek
              {isFilteringActive && ' (dengan filter aktif)'}
            </span>
            {isFilteringActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Hapus semua filter pencarian
              </button>
            )}
          </div>
        </div>
      )}

      {/* Projects Grid or Completely Empty State */}
      {projects.length === 0 ? (
        /* Zero Projects Left State */
        <div className="text-center py-20 px-6 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center shadow-inner">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Semua Proyek Telah Dikosongkan</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Tidak ada proyek tersimpan saat ini. Anda dapat membuat proyek kosong baru dari awal atau memilih template wawancara siap pakai di bawah.
          </p>
          <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onCreateProject()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Proyek Baru Pertama</span>
            </button>
            {onRestoreDefaultTemplates && (
              <button
                type="button"
                onClick={onRestoreDefaultTemplates}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Pulihkan Template Bawaan</span>
              </button>
            )}
          </div>
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        /* Filter/Search result empty */
        <div className="text-center py-16 px-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Tidak Ada Proyek yang Cocok</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tidak ditemukan proyek dengan kata kunci <strong>"{searchTerm}"</strong> atau filter kategori/tag yang dipilih.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              Reset Filter Pencarian
            </button>
            <button
              type="button"
              onClick={() => onCreateProject()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
            >
              + Buat Proyek Baru
            </button>
          </div>
        </div>
      ) : (
        /* Projects List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isConfirmingDelete = confirmDeleteId === project.id;
            const totalWords = project.turns.reduce(
              (acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length,
              0
            );
            const estDuration = project.turns.reduce((acc, t) => {
              const spk = project.speakers.find((s) => s.id === t.speakerId);
              return (
                acc +
                (t.audioDuration || Math.max(1.5, t.text.split(' ').length / 2.2)) +
                (t.pacingOverride?.pauseAfter ?? spk?.pacing.pauseAfter ?? 0.4)
              );
            }, 0);

            return (
              <div
                key={project.id}
                className={`relative rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/90 shadow-sm'
                }`}
              >
                <div>
                  {/* Header: Category & Active Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-indigo-400 border border-slate-700">
                      {project.category}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Aktif di Studio
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {project.description || 'Tidak ada deskripsi.'}
                  </p>

                  {/* Tags Pill Row (if any) */}
                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
                      {project.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-violet-950/40 text-violet-300 hover:text-white border border-slate-700/50 text-[10px] cursor-pointer transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Speakers Roster on Card */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[11px] font-medium text-slate-400">Pembicara ({project.speakers.length}):</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.speakers.map((spk) => {
                        const voice = getVoiceById(spk.voiceModelId);
                        return (
                          <div
                            key={spk.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-200"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: spk.color }}
                            />
                            <span className="font-medium truncate max-w-[120px]">{spk.name}</span>
                            <span className="text-slate-400">({voice.name.split(' ')[0]})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{project.turns.length} Giliran</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>Est. {formatDuration(estDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(project.updatedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div>
                  {isConfirmingDelete ? (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-2 animate-fade-in">
                      <div className="text-xs text-rose-200 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Hapus proyek ini secara permanen?</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(project.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          Ya, Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        <span>Buka di Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateProject(project)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Gandakan proyek"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Always allow deleting any project */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(project.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-800 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Hapus proyek ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pre-built Indonesian Templates Showcase */}
      <div className="border-t border-slate-800 pt-8 mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Template Wawancara Siap Pakai</h3>
            <p className="text-xs text-slate-400">
              Mulai cepat dengan format skenario wawancara autentik Indonesia yang telah dikonfigurasi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEFAULT_PROJECTS.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md">
                  Template {tpl.category}
                </span>
                <h4 className="text-sm font-bold text-white mt-2.5 mb-1">{tpl.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {tpl.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCreateProject(tpl)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-semibold text-slate-200 hover:text-white transition-all border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gunakan Template Ini</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
