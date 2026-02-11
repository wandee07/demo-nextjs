"use client";

import { useEffect, useMemo, useState } from "react";

type WorkLog = {
  _id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  activities?: string;
};

type NewNoteState = {
  title: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  color: string;
  activities: string;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultColor = "#3b82f6";
const legacyColorMap: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  rose: "#f43f5e",
};

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

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function getDateRange(startKey: string, endKey?: string) {
  const startDate = parseDateKey(startKey);
  if (!startDate) {
    return [];
  }
  const resolvedEndKey = endKey && endKey.trim() ? endKey : startKey;
  const endDate = parseDateKey(resolvedEndKey) ?? startDate;
  const from = startDate <= endDate ? startDate : endDate;
  const to = startDate <= endDate ? endDate : startDate;
  const result: string[] = [];

  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let guard = 0;
  while (cursor <= to && guard < 366) {
    result.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return result;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarDays(activeDate: Date) {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();

  const days = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    return new Date(year, month, dayNumber);
  });

  return days;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [notes, setNotes] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<NewNoteState>({
    title: "",
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    color: defaultColor,
    activities: "",
  });
  const today = new Date();

  const days = useMemo(() => buildCalendarDays(activeDate), [activeDate]);
  const monthLabel = getMonthLabel(activeDate);

  const goToPreviousMonth = () => {
    setActiveDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setActiveDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  useEffect(() => {
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

    loadNotes();
  }, []);

  const reloadNotes = async () => {
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
    }
  };

  const notesByDate = useMemo(() => {
    return notes.reduce<Record<string, WorkLog[]>>((acc, note) => {
      if (!note.date) {
        return acc;
      }
      const dateKeys = getDateRange(note.date, note.endDate);
      dateKeys.forEach((key) => {
        acc[key] = acc[key] ? [...acc[key], note] : [note];
      });
      return acc;
    }, {});
  }, [notes]);

  const openFormForDate = (date: Date) => {
    const dateKey = toDateKey(date);
    setNewNote((prev) => ({ ...prev, date: dateKey }));
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForNote = (note: WorkLog) => {
    setNewNote({
      title: note.title,
      date: note.date,
      endDate: note.endDate ?? "",
      startTime: note.startTime ?? "",
      endTime: note.endTime ?? "",
      color: normalizeColor(note.color),
      activities: note.activities ?? "",
    });
    setEditingId(String(note._id));
    setIsFormOpen(true);
  };

  const handleNoteChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setNewNote((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newNote.title || !newNote.date) {
      setErrorMessage("กรุณาใส่หัวข้องานและวันที่");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/notes/${editingId}` : "/api/notes",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingId
              ? {
                  ...newNote,
                  _id: editingId,
                  color: normalizeHexColor(newNote.color),
                }
              : { ...newNote, color: normalizeHexColor(newNote.color) },
          ),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่";
        throw new Error(message);
      }

      const saved = (await response.json()) as WorkLog;
      const normalizedSaved = {
        ...saved,
        _id: normalizeId(saved._id),
        color: normalizeColor(saved.color),
      };

      setNotes((prev) => {
        if (editingId) {
          return prev.map((note) =>
            note._id === editingId ? normalizedSaved : note,
          );
        }
        return [normalizedSaved, ...prev];
      });

      setNewNote({
        title: "",
        date: newNote.date,
        endDate: "",
        startTime: "",
        endTime: "",
        color: defaultColor,
        activities: "",
      });
      setEditingId(null);
      await reloadNotes();
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!editingId) {
      return;
    }
    const confirmed = window.confirm("ต้องการลบโน้ตนี้ใช่ไหม?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/notes/${editingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editingId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "ลบไม่สำเร็จ");
      }

      setNotes((prev) => prev.filter((note) => note._id !== editingId));
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "ลบไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              มุมมองรายเดือนสำหรับจัดการงานและโน้ต
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Prev
            </button>
            <div className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto  px-6 py-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="grid grid-cols-7 gap-px rounded-2xl border bg-gray-200 overflow-hidden min-h-[calc(100vh-220px)]">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide"
            >
              {label}
            </div>
          ))}

          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === activeDate.getMonth();
            const isToday = isSameDay(date, today);
            const dateKey = toDateKey(date);
            const dayNotes = notesByDate[dateKey] ?? [];

            return (
              <div
                key={`${date.toISOString()}-${index}`}
                className="bg-white min-h-[180px] px-4 py-3 flex flex-col gap-2 cursor-pointer hover:bg-blue-50/40"
                onClick={() => openFormForDate(date)}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="text-xs text-gray-400">Loading...</div>
                ) : dayNotes.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {dayNotes.slice(0, 2).map((note) => {
                      const noteColor = normalizeColor(note.color);
                      return (
                        <div
                          key={note._id}
                          className="text-xs rounded-md px-2 py-1 truncate text-white"
                          style={{ backgroundColor: noteColor }}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditForNote(note);
                          }}
                        >
                          {note.startTime ? `${note.startTime} • ` : ""}
                          {note.title}
                        </div>
                      );
                    })}
                    {dayNotes.length > 2 && (
                      <div className="text-[11px] text-gray-400">
                        +{dayNotes.length - 2} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-300">No notes</div>
                )}
              </div>
            );
          })}
          </div>

          <aside className="bg-white border rounded-2xl shadow-sm p-5 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "แก้ไขโน้ต" : "เพิ่มโน้ต"}
              </h2>
              {isFormOpen && (
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => setIsFormOpen(false)}
                >
                  ปิด
                </button>
              )}
            </div>

            {!isFormOpen ? (
              <div className="mt-4 text-sm text-gray-500">
                คลิกวันที่ในปฏิทินเพื่อเพิ่มโน้ตใหม่
              </div>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSaveNote}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    หัวข้องาน
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newNote.title}
                    onChange={handleNoteChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                    placeholder="เช่น Daily work log"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    วันที่
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newNote.date}
                    onChange={handleNoteChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={newNote.endDate}
                    onChange={handleNoteChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      เวลาเริ่ม
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={newNote.startTime}
                      onChange={handleNoteChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      เวลาสิ้นสุด
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={newNote.endTime}
                      onChange={handleNoteChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    รายละเอียด
                  </label>
                  <textarea
                    rows={3}
                    name="activities"
                    value={newNote.activities}
                    onChange={handleNoteChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                    placeholder="สรุปรายละเอียดงาน/โน้ต"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    สีโน้ต
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      name="color"
                      value={newNote.color}
                      onChange={handleNoteChange}
                      className="h-9 w-11 rounded border border-gray-200 bg-white p-1"
                    />
                    <input
                      type="text"
                      name="color"
                      value={newNote.color}
                      onChange={handleNoteChange}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-300"
                      placeholder={defaultColor}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDeleteNote}
                      disabled={isDeleting}
                      className="w-full rounded-lg border border-red-200 text-red-600 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingId
                        ? "Update Note"
                        : "Save Note"}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
