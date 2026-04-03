import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Tables from "@/lib/tables";

const normalizeRole = (value?: string | null): "Administrator" | "Editor" => {
  const role = (value || "").toLowerCase();
  return role === "admin" || role === "administrator" ? "Administrator" : "Editor";
};

const getAuthUserIdByEmail = async (serviceClient: any, email: string) => {
  const lowerEmail = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn("Could not list auth users:", error.message);
      return null;
    }

    const users = data?.users || [];
    const matched = users.find((u: any) => String(u.email || "").toLowerCase() === lowerEmail);
    if (matched?.id) return matched.id as string;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
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

    const { data: actorProfile, error: actorProfileError } = await serviceClient
      .from(Tables.Profiles)
      .select("role")
      .eq("id", actor.id)
      .maybeSingle();

    if (actorProfileError) {
      return NextResponse.json({ error: "Could not verify permissions" }, { status: 500 });
    }

    const actorRole = normalizeRole(actorProfile?.role);

    if (actorRole !== "Administrator" && actorRole !== "Editor") {
      return NextResponse.json({ error: "You do not have permission to invite users" }, { status: 403 });
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

    let authUserId = await getAuthUserIdByEmail(serviceClient, email);

    if (!authUserId) {
      const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          name,
          role: accessLevel,
        },
      });

      if (createUserError) {
        const message = createUserError.message.toLowerCase();
        const alreadyExists =
          message.includes("already") || message.includes("registered") || message.includes("exists");

        if (!alreadyExists) {
          return NextResponse.json({ error: createUserError.message }, { status: 400 });
        }

        authUserId = await getAuthUserIdByEmail(serviceClient, email);
      } else {
        authUserId = createdUser.user?.id || null;
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Could not resolve user account for invite" }, { status: 400 });
    }

    const { error: profileError } = await serviceClient
      .from(Tables.Profiles)
      .upsert(
        {
          id: authUserId,
          full_name: name,
          role: accessLevel,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
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
