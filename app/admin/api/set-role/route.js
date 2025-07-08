// app/admin/api/set-role/route.js
import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin"; // this wraps admin + serviceAccount securely

export async function POST(req) {
  try {
    const { uid, role } = await req.json();

    if (!uid || !role) {
      return NextResponse.json({ success: false, message: "Missing UID or role" }, { status: 400 });
    }

    await admin.auth().setCustomUserClaims(uid, { role });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error in API route:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

