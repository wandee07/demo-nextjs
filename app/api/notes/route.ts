import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import WorkLog from "@/models/WorkLog";

const legacyColorMap: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  rose: "#f43f5e",
};

function normalizeColor(color: unknown) {
  if (typeof color !== "string") {
    return undefined;
  }
  const trimmed = color.trim();
  if (!trimmed) {
    return undefined;
  }
  if (legacyColorMap[trimmed]) {
    return legacyColorMap[trimmed];
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return trimmed;
}

export async function GET() {
  try {
    await connectToDatabase();
    const notes = await WorkLog.find()
      .sort({ date: -1, startTime: -1, createdAt: -1 })
      .lean();
    const normalized = notes.map((note) => ({
      ...note,
      _id:
        typeof note._id === "string"
          ? note._id
          : note._id?.$oid ?? note._id?.toString?.() ?? "",
      color: normalizeColor(note.color),
    }));
    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      date,
      endDate,
      location,
      startTime,
      endTime,
      activities,
      result,
      blockers,
      participants,
      tags,
      color,
    } = body ?? {};

    if (!title || !date) {
      return NextResponse.json(
        { message: "Title and date are required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const saved = await WorkLog.create({
      title,
      date,
      endDate,
      location,
      startTime,
      endTime,
      activities,
      result,
      blockers,
      participants,
      tags,
      color: normalizeColor(color),
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create note." },
      { status: 500 },
    );
  }
}
