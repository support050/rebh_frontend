"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Save, Check, Loader2, Trash2, PlusCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface CompanyAnalystNotesProps {
  symbol: string;
}

export default function CompanyAnalystNotes({ symbol }: CompanyAnalystNotesProps) {
  const [note, setNote] = useState<string>("");
  const [savedNote, setSavedNote] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadNote() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/engine/notes/${symbol}`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && typeof data.note === "string" && data.note.trim()) {
            setNote(data.note);
            setSavedNote(data.note);
            setUpdatedAt(data.updated_at || null);
            setIsEditing(false);
            setLoading(false);
            return;
          }
        }
      } catch (_) {
        // Fallback to localStorage
      }

      try {
        const localNote = localStorage.getItem(`rebh_note_${symbol}`);
        if (isMounted && localNote && localNote.trim()) {
          setNote(localNote);
          setSavedNote(localNote);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (_) {
        setIsEditing(true);
      }

      if (isMounted) setLoading(false);
    }

    loadNote();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    setStatusMsg(null);

    // 1. LocalStorage immediate backup
    try {
      localStorage.setItem(`rebh_note_${symbol}`, note);
    } catch (_) {}

    // 2. Persist to API
    try {
      const res = await fetch(`${API_BASE_URL}/api/engine/notes/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note })
      });
      if (res.ok) {
        const data = await res.json();
        setUpdatedAt(data.updated_at || new Date().toISOString());
      }
      setSavedNote(note);
      setIsEditing(false);
      setStatusMsg("تم حفظ الملاحظة بنجاح ✓");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e) {
      console.warn("Saved locally, API sync warning:", e);
      setSavedNote(note);
      setIsEditing(false);
      setStatusMsg("تم الحفظ محلياً ✓");
      setTimeout(() => setStatusMsg(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟")) return;
    setDeleting(true);
    setStatusMsg(null);

    // 1. Clear LocalStorage
    try {
      localStorage.removeItem(`rebh_note_${symbol}`);
    } catch (_) {}

    // 2. Clear from API
    try {
      await fetch(`${API_BASE_URL}/api/engine/notes/${symbol}`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch (e) {
      console.warn("Deleted locally, API delete warning:", e);
    } finally {
      setNote("");
      setSavedNote("");
      setUpdatedAt(null);
      setIsEditing(true);
      setDeleting(false);
      setStatusMsg("تم حذف الملاحظة بنجاح");
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleStartNew = () => {
    setNote("");
    setIsEditing(true);
  };

  const handleEdit = () => {
    setNote(savedNote);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (savedNote) {
      setNote(savedNote);
      setIsEditing(false);
    }
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#8C3B32]" />
          ملاحظاتي وقراري التحليلي على السهم (My Notes)
        </h3>
        <span className="text-[11px] font-mono text-[#6B7280]">
          تُحفظ سحابياً ومحلياً وتُطبع في التقرير الرسمي «THE REPORT» ⎙
        </span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8C3B32]" />
          <span>جاري تحميل الملاحظات...</span>
        </div>
      ) : isEditing ? (
        /* Edit Mode: Textarea + Action Buttons */
        <div className="space-y-2">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سجل هنا أطروحتك الشخصية: نقاط الشراء، متى يتغير رأيك في السهم، المحفزات المستقبلية..."
            className="w-full text-xs p-3 rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] focus:bg-white focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/20 text-[#1A1A1A] transition-colors resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#9CA3AF]">
              {statusMsg || "اكتب أطروحتك ثم اضغط حفظ لتثبيتها في التقرير"}
            </span>

            <div className="flex items-center gap-2">
              {savedNote && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] text-xs font-semibold rounded-[4px] transition-colors"
                >
                  إلغاء
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !note.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold shadow-sm transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ الملاحظة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode: Note Content Card with Edit / Delete / New Note buttons */
        <div className="space-y-3">
          <div className="p-3.5 rounded-[4px] bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#1F2937] leading-relaxed whitespace-pre-wrap">
            {savedNote}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <div>
              {statusMsg ? (
                <span className="text-[#16A34A] font-semibold">{statusMsg}</span>
              ) : updatedAt ? (
                <span>آخر تحديث: {new Date(updatedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              ) : (
                <span>محفوظة محلياً وسحابياً</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8C3B32]" />
                <span>تعديل</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded-[4px] text-xs font-semibold transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>حذف</span>
              </button>

              <button
                type="button"
                onClick={handleStartNew}
                className="flex items-center gap-1 px-3 py-1 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ملاحظة جديدة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
