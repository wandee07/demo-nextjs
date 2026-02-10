import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 1. Sidebar */}
      <aside className="w-64 bg-white border-r p-6 hidden md:block">
        <h1 className="text-xl font-bold text-blue-600 mb-8">My Idea Tracker</h1>
        <nav className="space-y-4">
        <a href="/calendar"><div className="text-gray-600 hover:text-blue-500 cursor-pointer font-medium py-2 px-4 rounded-lg">Calendar</div></a>
          <a href="/notes"><div className="text-gray-600 hover:text-blue-500 cursor-pointer font-medium py-2 px-4 rounded-lg">All Notes</div></a>
          <a href="/ideas"><div className="text-gray-600 hover:text-blue-500 cursor-pointer font-medium py-2 px-4 rounded-lg">New Ideas</div></a>
          <a href="/completed"><div className="text-gray-600 hover:text-blue-500 cursor-pointer font-medium py-2 px-4 rounded-lg">Completed</div></a>
        </nav>
      </aside>

      {/* 2. Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="bg-gray-100 px-4 py-2 rounded-lg w-1/3 outline-none focus:ring-2 ring-blue-300"
          />
          <button  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Link href="/new-note">
              + New Note
            </Link>
          </button>
        </header>

        {/* Content - Grid Layout */}
        <section className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ตัวอย่าง Card ไอเดีย (สามารถทำเป็น Component ได้) */}
            <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&h=200&auto=format&fit=crop" alt="cover" className="w-full h-32 object-cover" />
              <div className="p-4">
                <span className="text-xs font-bold text-blue-500 uppercase">Coding</span>
                <h3 className="font-semibold text-lg mt-1">สร้างแอปด้วย Next.js</h3>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">ไอเดียการสร้างโปรเจกต์แรกสำหรับหัดเขียน React และ Next.js App Router...</p>
                <div className="mt-4 text-xs text-gray-400">Created: 6 Feb 2026</div>
              </div>
            </div>

            {/* เพิ่ม Card อื่นๆ ตรงนี้ */}

          </div>
        </section>
      </main>
    </div>
  );
}
