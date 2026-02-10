import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const bodyId = body?._id as string | undefined;
    const targetId = params?.id;
    const validParamId =
      targetId && mongoose.Types.ObjectId.isValid(targetId) ? targetId : null;
    const validBodyId =
      bodyId && mongoose.Types.ObjectId.isValid(bodyId) ? bodyId : null;

    const resolvedId = validParamId ?? validBodyId;

    if (!resolvedId) {
      return NextResponse.json(
        { message: "Invalid note id." },
        { status: 400 },
      );
    }
    await connectToDatabase();

    const updatePayload = {
      title: body?.title,
      date: body?.date,
      location: body?.location,
      startTime: body?.startTime,
      endTime: body?.endTime,
      activities: body?.activities,
      result: body?.result,
      blockers: body?.blockers,
      participants: body?.participants,
      tags: body?.tags,
      color: normalizeColor(body?.color),
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });

    const updated = await WorkLog.findByIdAndUpdate(
      resolvedId,
      updatePayload,
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ message: "Note not found." }, { status: 404 });
    }

    const normalized = {
      ...updated,
      _id:
        typeof updated._id === "string"
          ? updated._id
          : updated._id?.$oid ?? updated._id?.toString?.() ?? "",
      color: normalizeColor(updated.color),
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update note." },
      { status: 500 },
    );
  }
}
