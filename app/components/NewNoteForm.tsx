"use client";

import { useState } from "react";

type WorkLogFormState = {
    title: string;
    date: string;
    endDate: string;
    location: string;
    startTime: string;
    endTime: string;
    activities: string;
    result: string;
    blockers: string;
    participants: string;
    tags: string;
    color: string;
};

const initialState: WorkLogFormState = {
    title: "",
    date: "",
    endDate: "",
    location: "",
    startTime: "",
    endTime: "",
    activities: "",
    result: "",
    blockers: "",
    participants: "",
    tags: "",
    color: "#3b82f6",
};

export default function NewNoteForm() {
    const [formState, setFormState] = useState(initialState);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        try {
            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formState),
            });

            if (!response.ok) {
                throw new Error("save_failed");
            }

            setFormState(initialState);
            setStatusMessage("บันทึกเรียบร้อยแล้ว");
        } catch (error) {
            setStatusMessage("บันทึกไม่สำเร็จ กรุณาลองใหม่");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className="bg-white rounded-2xl border shadow-sm p-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        หัวข้องาน
                    </label>
                    <input type="text" name="title" value={formState.title} onChange={handleChange} placeholder="เช่น Daily work log, ประชุมทีม, แก้บั๊กฟอร์ม" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่</label>
                    <input type="date" name="date" value={formState.date} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        วันที่สิ้นสุด
                    </label>
                    <input type="date" name="endDate" value={formState.endDate} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        สถานที่/ช่องทาง
                    </label>
                    <input type="text" name="location" value={formState.location} onChange={handleChange} placeholder="เช่น ห้องประชุม A / Google Meet" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        สีโน้ต
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                        <input type="color" name="color" value={formState.color} onChange={handleChange} className="h-10 w-12 rounded border border-gray-200 bg-white p-1"/>
                        <input type="text" name="color" value={formState.color} onChange={handleChange} className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300" placeholder="#3b82f6"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        เวลาเริ่ม
                    </label>
                    <input type="time" name="startTime" value={formState.startTime} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        เวลาสิ้นสุด
                    </label>
                    <input type="time" name="endTime" value={formState.endTime} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ทำอะไรอยู่บ้าง
                    </label>
                    <textarea rows={4} name="activities" value={formState.activities} onChange={handleChange} placeholder="เช่น ทำ UI หน้า Dashboard, แก้บั๊กฟอร์ม, เขียนสรุปรายงาน" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ผลลัพธ์ / สรุปงาน
                    </label>
                    <textarea rows={3} name="result" value={formState.result} onChange={handleChange} placeholder="สรุปสิ่งที่เสร็จและสิ่งที่ต้องทำต่อ" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:ring-2 ring-blue-300" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        อุปสรรค / สิ่งที่ติดขัด
                    </label>
                    <textarea rows={3} name="blockers"  value={formState.blockers} onChange={handleChange} placeholder="เช่น รอข้อมูลจากทีม, API ยังไม่พร้อม" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ผู้เกี่ยวข้อง/ผู้เข้าร่วม
                    </label>
                    <input type="text" name="participants" value={formState.participants} onChange={handleChange} placeholder="เช่น Design Team, Dev Team" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <input type="text" name="tags" value={formState.tags} onChange={handleChange} placeholder="เช่น ui, bugfix, report" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:ring-2 ring-blue-300"/>
                </div>
            </div>
            {statusMessage && (<p className="mt-4 text-sm text-gray-600">{statusMessage}</p>)}
            <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => { setFormState(initialState);setStatusMessage("");}}>
                    Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Note"}
                </button>
            </div>
        </form>
    );
}
