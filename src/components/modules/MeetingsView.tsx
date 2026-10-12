'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Meeting, MeetingActionItem } from '@/types';
import * as XLSX from 'xlsx';
import { 
  Users2, Plus, Search, Download, Printer, CheckCircle2, 
  Clock, ArrowRight, UserCheck, Calendar, AlertCircle
} from 'lucide-react';
import { PrintableDocumentModal } from '@/components/common/PrintableDocumentModal';

export function MeetingsView() {
  const { currentProjectId, currentProject, language, t } = useProject();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'meetings' | 'action_items'>('meetings');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // New Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('Technical Coordination');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLocation, setNewLocation] = useState('Site Project Office - Main Conference Hall');
  const [newAgenda, setNewAgenda] = useState('');
  const [newDiscussion, setNewDiscussion] = useState('');
  const [newDecisions, setNewDecisions] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionAssignee, setActionAssignee] = useState('Eng. Hisham Al-Husseini');
  const [actionDue, setActionDue] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [generatedDocNum, setGeneratedDocNum] = useState('');

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings?projectId=${currentProjectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMeetings(json.data);
      }
    } catch (e) {
      console.error('Error fetching meetings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [currentProjectId]);

  const generateNumber = async () => {
    try {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          docType: 'MOM',
          discipline: 'MEP',
        }),
      });
      const json = await res.json();
      if (json.success && json.docNumber) {
        setGeneratedDocNum(json.docNumber);
      }
    } catch (e) {
      console.error('Error generating MOM number', e);
    }
  };

  const handleOpenCreateModal = () => {
    generateNumber();
    setCreateModalOpen(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          meetingNumber: generatedDocNum,
          meetingType: newType,
          title: newTitle,
          dateTime: `${newDate}T10:00:00`,
          location: newLocation,
          attendees: [
            { name: 'Eng. Aly Ketkat', role: 'Document Control Manager', company: 'APEX DC', present: true },
            { name: 'Eng. Tariq Al-Mansoor', role: 'Supervising Consultant', company: 'Dar Al-Handasah', present: true },
            { name: 'Eng. Hisham Al-Husseini', role: 'MEP Construction Manager', company: 'APEX', present: true },
          ],
          agenda: newAgenda || '1. Shop drawing approvals\n2. Outstanding RFIs\n3. Site progress and inspections',
          discussionPoints: newDiscussion || 'Reviewed status of active submissions and agreed on milestone deadlines.',
          decisions: newDecisions || 'Approved technical clarifications for pipe coordination.',
          actionItems: actionDesc ? [
            {
              id: `act-${Date.now()}`,
              meetingId: '',
              projectId: currentProjectId,
              itemNumber: 'ACT-01',
              description: actionDesc,
              assignedTo: actionAssignee,
              dueDate: actionDue,
              status: 'Open',
            }
          ] : [],
          minutesPreparedBy: 'Eng. Aly Ketkat',
          status: 'Minutes Issued',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModalOpen(false);
        setNewTitle('');
        fetchMeetings();
      }
    } catch (err) {
      alert('Error creating MOM');
    }
  };

  // Collect all action items across meetings
  const allActionItems: { meetingNum: string; action: MeetingActionItem }[] = [];
  meetings.forEach(m => {
    m.actionItems.forEach(a => {
      allActionItems.push({ meetingNum: m.meetingNumber, action: a });
    });
  });

  const exportToExcel = () => {
    const exportData = meetings.map((m, index) => ({
      '#': index + 1,
      'Meeting Number': m.meetingNumber,
      'Title': m.title,
      'Type': m.meetingType,
      'Date': m.dateTime.split('T')[0],
      'Location': m.location,
      'Actions Count': m.actionItems.length,
      'Status': m.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MOM_Register');
    XLSX.writeFile(wb, `${currentProject?.code || 'PROJECT'}_MEETINGS_MOM.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'إدارة الاجتماعات ومحاضر الجلسات (MOM) ومتابعة المهام' : 'Meeting Management (MOM) & Action Tracker'}
            </h2>
            <span className="font-mono text-xs font-bold bg-violet-50 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
              {meetings.length} Meetings • {allActionItems.length} Actions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical coordination minutes, attendees, carried-forward action items & formal MOM generation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'meetings' ? 'bg-white shadow-xs text-navy-950 font-bold' : 'text-slate-600'}`}
            >
              Meetings & Minutes
            </button>
            <button
              onClick={() => setActiveTab('action_items')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'action_items' ? 'bg-white shadow-xs text-navy-950 font-bold' : 'text-slate-600'}`}
            >
              Action Items Register ({allActionItems.length})
            </button>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'محضر اجتماع جديد' : 'New Meeting'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'meetings' ? (
        /* Meetings Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
                <tr>
                  <th className="py-3 px-3">MOM Number</th>
                  <th className="py-3 px-3">Title & Meeting Type</th>
                  <th className="py-3 px-3">Date & Location</th>
                  <th className="py-3 px-3">Key Attendees</th>
                  <th className="py-3 px-3 text-center">Action Items</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {m.meetingNumber}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{m.title}</div>
                      <div className="text-[11px] text-slate-500">{m.meetingType}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-mono">{m.dateTime.replace('T', ' ')}</div>
                      <div className="text-[10px] text-slate-400">{m.location}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-600">
                      {m.attendees.map(a => a.name.split(' ')[1] || a.name).join(', ')}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                      <span className="bg-violet-50 text-violet-800 border border-violet-200 px-2 py-0.5 rounded">
                        {m.actionItems.length} Actions
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMeeting(m);
                          setPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-navy-900 transition"
                        title="Print Formal Minutes of Meeting (MOM)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Action Items Register View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#0F2744] text-white uppercase text-[10px] font-bold tracking-wider select-none">
                <tr>
                  <th className="py-3 px-3">Action Item #</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Originating MOM</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Carried Forward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allActionItems.map(({ meetingNum, action }) => (
                  <tr key={action.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {action.itemNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-800 max-w-sm font-medium">
                      {action.description}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {meetingNum}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-700">
                      {action.assignedTo}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                      {action.dueDate}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        action.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        action.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {action.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] font-mono text-slate-500">
                      {action.carriedFromMeetingNumber || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Create Minutes of Meeting (MOM)</h3>
                <div className="text-[11px] text-slate-300">Record technical coordination decisions & action items</div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MOM Number</label>
                  <input
                    type="text"
                    value={generatedDocNum}
                    onChange={(e) => setGeneratedDocNum(e.target.value)}
                    className="w-full bg-slate-50 font-mono font-bold text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meeting Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-bold"
                  >
                    <option value="Technical Coordination">Technical Coordination</option>
                    <option value="Progress Meeting">Progress Meeting</option>
                    <option value="QA/QC Meeting">QA/QC Meeting</option>
                    <option value="Consultant Review">Consultant Review</option>
                    <option value="Client Meeting">Client Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Technical Coordination & BIM Clash Resolution #27"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Action Item Box */}
              <div className="p-3 bg-slate-50 border rounded space-y-2">
                <div className="font-bold text-slate-800">Assign Initial Action Item</div>
                <input
                  type="text"
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Action item description..."
                  className="w-full border border-slate-300 rounded p-1.5 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    placeholder="Assignee name"
                    className="border border-slate-300 rounded p-1.5 text-xs"
                  />
                  <input
                    type="date"
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                    className="border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  Issue Minutes of Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <PrintableDocumentModal
        docType="MOM"
        title="MINUTES OF MEETING (MOM)"
        data={selectedMeeting}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </div>
  );
}
