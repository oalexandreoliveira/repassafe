import { registrationContext } from "@/lib/registration";

export async function GET() {
  const identity = await registrationContext();
  const { data, error } = await identity.admin.rpc("registration_read", {
    target_user: identity.userId,
  });
  if (error || !data?.draft?.photo_path)
    return new Response(null, { status: 404 });
  const { data: photo, error: downloadError } = await identity.admin.storage
    .from("profile-photos")
    .download(data.draft.photo_path);
  if (downloadError || !photo) return new Response(null, { status: 404 });
  return new Response(await photo.arrayBuffer(), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
