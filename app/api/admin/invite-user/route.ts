import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Tables from "@/lib/tables";

const normalizeRole = (value?: string | null): "Admin" | "Editor" => {
  const role = (value || "").toLowerCase();
  return role === "admin" || role === "administrator" ? "Admin" : "Editor";
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server is missing Supabase configuration." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: actor },
      error: actorError,
    } = await anonClient.auth.getUser(token);

    if (actorError || !actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actorRole, error: actorRoleError } = await serviceClient
      .from(Tables.UsersRoles)
      .select("access_level, role, status")
      .eq("user_id", actor.id)
      .maybeSingle();

    if (actorRoleError) {
      return NextResponse.json({ error: "Could not verify permissions" }, { status: 500 });
    }

    const actorAccess = String(actorRole?.access_level || actorRole?.role || "").toLowerCase();
    const actorStatus = String(actorRole?.status || "").toLowerCase();
    const isAdmin = actorAccess === "admin" || actorAccess === "administrator";

    if (!isAdmin || actorStatus === "inactive") {
      return NextResponse.json({ error: "Only active admins can invite users" }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const accessLevel = normalizeRole(body?.accessLevel);

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/set-password`;

    const { data: existingRoleRow } = await serviceClient
      .from(Tables.UsersRoles)
      .select("id, user_id, email")
      .eq("email", email)
      .maybeSingle();

    let authUserId = existingRoleRow?.user_id || null;

    if (!authUserId) {
      const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          name,
          role: accessLevel,
          access_level: accessLevel,
        },
      });

      if (createUserError) {
        const message = createUserError.message.toLowerCase();
        const alreadyExists =
          message.includes("already") || message.includes("registered") || message.includes("exists");

        if (!alreadyExists) {
          return NextResponse.json({ error: createUserError.message }, { status: 400 });
        }
      } else {
        authUserId = createdUser.user?.id || null;
      }
    }

    if (existingRoleRow?.id) {
      const { error: updateRoleError } = await serviceClient
        .from(Tables.UsersRoles)
        .update({
          name,
          role: accessLevel,
          access_level: accessLevel,
          status: "Invited",
          ...(authUserId ? { user_id: authUserId } : {}),
        })
        .eq("id", existingRoleRow.id);

      if (updateRoleError) {
        return NextResponse.json({ error: updateRoleError.message }, { status: 400 });
      }
    } else {
      const { error: insertRoleError } = await serviceClient
        .from(Tables.UsersRoles)
        .insert([
          {
            user_id: authUserId,
            name,
            email,
            role: accessLevel,
            access_level: accessLevel,
            department: "",
            status: "Invited",
          },
        ]);

      if (insertRoleError) {
        return NextResponse.json({ error: insertRoleError.message }, { status: 400 });
      }
    }

    const { error: resetError } = await serviceClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      return NextResponse.json(
        { message: "User invited, but password setup email could not be sent." },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: `Invite sent to ${email}` }, { status: 200 });
  } catch (error: any) {
    console.error("Invite user error:", error);
    return NextResponse.json({ error: error?.message || "Failed to invite user" }, { status: 500 });
  }
}
