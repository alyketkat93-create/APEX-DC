'use client';

import React, { useState } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, Download, FileText, 
  MessageSquare, History, Layers, Maximize2, Shield, Eye
} from 'lucide-react';
import { Drawing } from '@/types';

interface DocumentViewerModalProps {
  drawing: Drawing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({ drawing, isOpen, onClose }: DocumentViewerModalProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'revisions' | 'metadata' | 'markup'>('preview');
  const [markupComments, setMarkupComments] = useState<string[]>([
    'Review Note 1: Check clearances at grid D-7.',
    'BIM Clash: Coordinated with structural opening drawing S-204.'
  ]);
  const [newComment, setNewComment] = useState('');

  if (!isOpen || !drawing) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setMarkupComments(prev => [...prev, newComment]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/85 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-navy-700 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0B1D30] border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
              DWG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-100">{drawing.drawingNumber}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-800 text-amber-300 border border-navy-700">
                  Rev: {drawing.currentRevision}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  drawing.approvalCode === 'A' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  drawing.approvalCode === 'B' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-navy-800 text-slate-300'
                }`}>
                  {drawing.reviewStatus}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-xl">
                {drawing.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewer Controls */}
            <div className="flex items-center gap-1 bg-navy-800 rounded px-1.5 py-1 border border-navy-700 text-xs">
              <button onClick={handleZoomOut} className="p-1 hover:bg-navy-700 rounded text-slate-300" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] px-1">{zoomLevel}%</span>
              <button onClick={handleZoomIn} className="p-1 hover:bg-navy-700 rounded text-slate-300" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleRotate} className="p-1 hover:bg-navy-700 rounded text-slate-300" title="Rotate 90°">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <a
              href={`#download-${drawing.id}`}
              onClick={(e) => {
                e.preventDefault();
                alert(`Starting secure file download for ${drawing.drawingNumber} (${drawing.fileSize || 'PDF Document'})`);
              }}
              className="flex items-center gap-1 bg-navy-800 hover:bg-navy-700 border border-navy-700 px-2.5 py-1.5 rounded text-xs text-slate-200 transition"
              title="Download Original File"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-navy-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace: Canvas + Sidebar Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Drawing Canvas / Preview Screen */}
          <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center relative">
            <div 
              style={{ 
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className="bg-white text-slate-900 rounded shadow-2xl p-8 max-w-3xl w-full min-h-[500px] border border-slate-700 flex flex-col justify-between"
            >
              {/* Engineering Drawing Mock View */}
              <div>
                <div className="border-4 border-slate-900 p-4 mb-4">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-3">
                    <div>
                      <div className="text-xl font-black tracking-tight text-navy-950">APEX ENGINEERING DRAWINGS</div>
                      <div className="text-[10px] font-bold text-slate-600">CENTRAL DISCIPLINE DESIGN & COORDINATION</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">{drawing.drawingNumber}</div>
                      <div className="text-[10px] font-bold text-amber-700">REVISION: {drawing.currentRevision}</div>
                    </div>
                  </div>

                  {/* Drawing Blueprint Graphic Representation */}
                  <div className="h-64 bg-slate-100 border border-slate-300 rounded relative overflow-hidden flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64748b" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    <div className="relative z-10 text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-navy-900/10 border-2 border-navy-900 mx-auto flex items-center justify-center mb-2">
                        <Layers className="w-8 h-8 text-navy-900" />
                      </div>
                      <div className="font-bold text-sm text-slate-900 uppercase tracking-wider">{drawing.title}</div>
                      <div className="text-xs text-slate-600 mt-1 font-mono">
                        DISCIPLINE: {drawing.discipline} • SYSTEM: {drawing.system} • LEVEL: {drawing.floorLevel}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        CAD Reference: {drawing.cadFileRef || 'DWG-MEP-COORDINATED.dwg'} • BIM ID: {drawing.bimModelRef || 'RVT-ZONE-A-MEP.rvt'}
                      </div>
                    </div>

                    {/* Consultant Approval Stamp Overlay on Drawing */}
                    {drawing.approvalCode && (
                      <div className="absolute bottom-3 right-3 bg-white/95 border-2 border-slate-900 p-2 text-center rounded shadow-md text-[10px]">
                        <div className="font-bold text-slate-900">CONSULTANT STAMP</div>
                        <div className={`font-black text-xs ${
                          drawing.approvalCode === 'A' ? 'text-emerald-700' :
                          drawing.approvalCode === 'B' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          CODE {drawing.approvalCode} — {drawing.reviewStatus}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">{drawing.approvalDate || drawing.revisionDate}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title Block Bottom */}
              <div className="border-2 border-slate-900 grid grid-cols-4 divide-x divide-slate-900 text-[9px] p-1 font-mono">
                <div><strong>SCALE:</strong> 1:100 @ A1</div>
                <div><strong>DATE:</strong> {drawing.revisionDate}</div>
                <div><strong>DRAWN:</strong> {drawing.originator}</div>
                <div><strong>CHECKED:</strong> Lead Technical CM</div>
              </div>
            </div>
          </div>

          {/* Right Inspector & Revision Panel */}
          <div className="w-80 bg-[#0B1D30] border-l border-navy-800 flex flex-col text-xs">
            <div className="flex border-b border-navy-800">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-2 text-center font-semibold transition ${
                  activeTab === 'preview' ? 'border-b-2 border-amber-400 text-amber-300 bg-navy-800/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`flex-1 py-2 text-center font-semibold transition ${
                  activeTab === 'revisions' ? 'border-b-2 border-amber-400 text-amber-300 bg-navy-800/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revisions ({drawing.revisions.length})
              </button>
              <button
                onClick={() => setActiveTab('markup')}
                className={`flex-1 py-2 text-center font-semibold transition ${
                  activeTab === 'markup' ? 'border-b-2 border-amber-400 text-amber-300 bg-navy-800/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                Notes
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'preview' && (
                <div className="space-y-3">
                  <div className="bg-navy-900/80 p-3 rounded-lg border border-navy-800 space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Metadata</div>
                    <div className="flex justify-between"><span className="text-slate-400">Type:</span> <span className="font-semibold">{drawing.drawingType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Discipline:</span> <span className="font-semibold">{drawing.discipline}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Zone:</span> <span className="font-semibold">{drawing.buildingZone}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Floor:</span> <span className="font-semibold">{drawing.floorLevel}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">File Size:</span> <span className="font-mono text-amber-300">{drawing.fileSize || '14.8 MB'}</span></div>
                  </div>

                  <div className="bg-navy-900/80 p-3 rounded-lg border border-navy-800 space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Consultant Review</div>
                    <div><span className="text-slate-400">Reviewer:</span> <div className="font-semibold mt-0.5">{drawing.reviewer || 'Under Consultant Review'}</div></div>
                    <div><span className="text-slate-400">Decision Code:</span> <span className="font-bold text-amber-400 ml-1">{drawing.approvalCode || 'Pending'}</span></div>
                    {drawing.reviewComments && (
                      <div className="mt-2 text-slate-300 text-[11px] p-2 bg-navy-950/60 rounded border border-navy-800">
                        {drawing.reviewComments}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'revisions' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Revision History</div>
                  {drawing.revisions.map((rev, idx) => (
                    <div key={idx} className="bg-navy-900/80 p-3 rounded-lg border border-navy-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 text-sm">Rev {rev.revisionNumber}</span>
                        <span className="text-[10px] text-slate-400">{rev.submissionDate}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{rev.status}</div>
                      {rev.comments && (
                        <p className="text-[11px] text-slate-400 italic bg-navy-950/40 p-1.5 rounded mt-1">
                          "{rev.comments}"
                        </p>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono">
                        Transmittal: {rev.transmittalNumber || 'Direct Submission'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'markup' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Clash & Markup Notes</div>
                  <div className="space-y-2">
                    {markupComments.map((note, i) => (
                      <div key={i} className="p-2.5 rounded bg-navy-900/80 border border-navy-800 text-[11px] text-slate-300">
                        {note}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="pt-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add engineering review note..."
                      className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      rows={3}
                    />
                    <button
                      type="submit"
                      className="mt-2 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded text-xs transition"
                    >
                      Add Review Note
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
