import React, { useState } from 'react';
import { Check, X, Clock, MessageSquare, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { api } from '../services/api';

export default function StudentCard({ 
  student, 
  status, 
  onStatusChange, 
  remarks, 
  onRemarksChange, 
  index,
  availableBatches = ['B1', 'B2'],
  onBatchUpdated
}) {
  const [showRemarks, setShowRemarks] = useState(false);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(student.lab_batch || 'B1');

  // Status button variants
  const getCardBorder = () => {
    switch (status) {
      case 'present': return 'border-emerald-200 bg-white hover:border-emerald-300';
      case 'absent': return 'border-rose-200 bg-rose-50/20 hover:border-rose-300';
      case 'late': return 'border-amber-200 bg-amber-50/20 hover:border-amber-300';
      default: return 'border-slate-200 bg-white';
    }
  };

  const handleBatchSave = async (newBatch) => {
    try {
      const res = await api.updateStudentBatch(student.id, newBatch);
      if (res.success) {
        student.lab_batch = newBatch;
        setSelectedBatch(newBatch);
        setIsEditingBatch(false);
        if (onBatchUpdated) onBatchUpdated(student.id, newBatch);
      }
    } catch (err) {
      alert('Failed to update batch: ' + err.message);
    }
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-all shadow-sm ${getCardBorder()}`}>
      <div className="flex items-center justify-between gap-3">
        
        {/* Student Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                {student.roll_number}
              </span>
              
              {/* Batch Pill with Inline Quick Edit */}
              {!isEditingBatch ? (
                <button
                  type="button"
                  onClick={() => setIsEditingBatch(true)}
                  className="text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all"
                  title="Click to edit student lab batch"
                >
                  <span>Batch {student.lab_batch}</span>
                  <Edit2 className="w-2.5 h-2.5 opacity-60" />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white border border-violet-300 p-0.5 rounded">
                  <select
                    value={selectedBatch}
                    onChange={(e) => handleBatchSave(e.target.value)}
                    className="text-[10px] font-bold text-violet-800 bg-transparent focus:outline-none"
                    autoFocus
                  >
                    {availableBatches.map(b => (
                      <option key={b} value={b}>Batch {b}</option>
                    ))}
                    <option value="B3">Batch B3</option>
                    <option value="B4">Batch B4</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsEditingBatch(false)}
                    className="text-[9px] text-slate-400 hover:text-slate-600 px-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
              {student.name}
            </h4>
          </div>
        </div>

        {/* Quick Touch Toggle Buttons: P | A | L */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl">
          
          {/* Present Button */}
          <button
            type="button"
            onClick={() => onStatusChange(student.id, 'present')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all touch-press ${
              status === 'present'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
            title="Mark Present"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Absent Button */}
          <button
            type="button"
            onClick={() => onStatusChange(student.id, 'absent')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all touch-press ${
              status === 'absent'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-105'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
            title="Mark Absent"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Late Button */}
          <button
            type="button"
            onClick={() => onStatusChange(student.id, 'late')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all touch-press ${
              status === 'late'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200 scale-105'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
            title="Mark Late"
          >
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>

      </div>

      {/* Remarks Toggle & Optional Input */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowRemarks(!showRemarks)}
          className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
        >
          <MessageSquare className="w-3 h-3" />
          <span>{remarks ? `Note: "${remarks}"` : 'Add remark'}</span>
          {showRemarks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <span className={`capitalize font-bold text-[11px] ${
          status === 'present' ? 'text-emerald-600' : status === 'absent' ? 'text-rose-600' : 'text-amber-600'
        }`}>
          ● {status}
        </span>
      </div>

      {showRemarks && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="e.g. Approved Medical Leave / Late bus"
            value={remarks || ''}
            onChange={(e) => onRemarksChange(student.id, e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      )}
    </div>
  );
}
