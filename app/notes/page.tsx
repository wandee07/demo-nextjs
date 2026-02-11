"use client";

import { useEffect, useState } from "react";

type WorkLog = {
  _id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  result?: string;
  tags?: string;
  color?: string;
};

type EditState = {
  title: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  result: string;
  tags: string;
  color: string;
};

const defaultColor = "#3b82f6";
const legacyColorMap: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  rose: "#f43f5e",
};

function normalizeColor(color: string | undefined) {
  if (!color) {
    return defaultColor;
  }
  if (legacyColorMap[color]) {
    return legacyColorMap[color];
  }
  if (/^[0-9a-fA-F]{6}$/.test(color)) {
    return `#${color}`;
  }
  return color;
}

function normalizeHexColor(color: string) {
  const trimmed = color.trim();
  if (legacyColorMap[trimmed]) {
    return legacyColorMap[trimmed];
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return defaultColor;
}

function normalizeId(id: unknown) {
  if (typeof id === "string") {
    return id;
  }
  if (id && typeof id === "object") {
    const maybeOid = (id as { $oid?: string }).$oid;
    if (maybeOid) {
      return maybeOid;
    }
    const toString = (id as { toString?: () => string }).toString;
    if (toString) {
      return toString();
    }
  }
  return "";
}

export default function NotesPage() {
  const [notes, setNotes] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadNotes = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/notes", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("fetch_failed");
        }
        const data = (await response.json()) as WorkLog[];
        const normalized = data.map((note) => ({
          ...note,
          _id: normalizeId(note._id),
        }));
        setNotes(normalized);
      } catch (error) {
        setErrorMessage("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadNotes();
  }, []);

  const openEdit = (note: WorkLog) => {
    setEditingId(String(note._id));
    setEditState({
      title: note.title,
      date: note.date,
      endDate: note.endDate ?? "",
      startTime: note.startTime ?? "",
      endTime: note.endTime ?? "",
      location: note.location ?? "",
      result: note.result ?? "",
      tags: note.tags ?? "",
      color: normalizeColor(note.color),
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setEditState((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingId || !editState) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/notes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editState,
          _id: editingId,
          color: normalizeHexColor(editState.color),
        }),
      });

      if (!response.ok) {
        throw new Error("update_failed");
      }

      await loadNotes();
      closeEdit();
    } catch (error) {
      setErrorMessage("อัปเดตไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    const confirmed = window.confirm("ต้องการลบโน้ตนี้ใช่ไหม?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(noteId);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: noteId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "ลบไม่สำเร็จ");
      }

      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      if (editingId === noteId) {
        closeEdit();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "ลบไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
          <p className="mt-1 text-sm text-gray-500">
            รายการบันทึกงานทั้งหมด
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-gray-400">ยังไม่มีบันทึก</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-xl border shadow-sm p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {note.date}
                      {note.endDate && note.endDate !== note.date
                        ? ` - ${note.endDate}`
                        : ""}
                      {note.startTime ? ` • ${note.startTime}` : ""}
                      {note.endTime ? ` - ${note.endTime}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: normalizeColor(note.color) }}
                    >
                      {note.tags || "Note"}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => openEdit(note)}
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(note._id)}
                      disabled={isDeleting === note._id}
                    >
                      {isDeleting === note._id ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>

                {(note.location || note.result) && (
                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                    {note.location && (
                      <p>
                        <span className="font-medium text-gray-700">
                          Location:
                        </span>{" "}
                        {note.location}
                      </p>
                    )}
                    {note.result && (
                      <p>
                        <span className="font-medium text-gray-700">
                          Summary:
                        </span>{" "}
                        {note.result}
                      </p>
                    )}
                  </div>
                )}

                {editingId === note._id && editState && (
                  <form
                    className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                    onSubmit={handleEditSubmit}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600">
                          หัวข้องาน
                        </label>
                        <input
                          name="title"
                          value={editState.title}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          วันที่
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={editState.date}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          วันที่สิ้นสุด
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={editState.endDate}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          สีโน้ต
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="color"
                            name="color"
                            value={editState.color}
                            onChange={handleEditChange}
                            className="h-9 w-11 rounded border border-gray-200 bg-white p-1"
                          />
                          <input
                            name="color"
                            value={editState.color}
                            onChange={handleEditChange}
                            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          เวลาเริ่ม
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={editState.startTime}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          เวลาสิ้นสุด
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={editState.endTime}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600">
                          สถานที่/ช่องทาง
                        </label>
                        <input
                          name="location"
                          value={editState.location}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600">
                          ผลลัพธ์ / สรุปงาน
                        </label>
                        <input
                          name="result"
                          value={editState.result}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Tags
                        </label>
                        <input
                          name="tags"
                          value={editState.tags}
                          onChange={handleEditChange}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={closeEdit}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
