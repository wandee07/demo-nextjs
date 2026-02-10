import NewNoteForm from "../components/NewNoteForm";

export default function NewNotePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">New Note</h1>
          <p className="mt-1 text-sm text-gray-500">
            สร้างโน้ตใหม่เพื่อบันทึกไอเดียหรือข้อมูลสำคัญ
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <NewNoteForm />
      </main>
    </div>
  );
}
