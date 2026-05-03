import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/listings/new")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: NewListing,
});

function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "house", price_usd: "", country: "", city: "", cover_url: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return; setBusy(true);
    const { error } = await supabase.from("properties").insert({
      agent_id: user.id,
      title: form.title, description: form.description, type: form.type as "land"|"house"|"apartment"|"commercial"|"farm",
      price_usd: Number(form.price_usd), country: form.country, city: form.city, cover_url: form.cover_url || null,
      status: "active",
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Listing published"); navigate({ to: "/dashboard" }); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Link to="/dashboard" className="text-sm text-muted-foreground">← Dashboard</Link>
      <h1 className="text-3xl font-display font-bold mt-2">New listing</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 bg-card border border-border rounded-2xl p-6">
        <input required placeholder="Title" value={form.title} onChange={set("title")} className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none" />
        <textarea placeholder="Description" value={form.description} onChange={set("description")} rows={4} className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.type} onChange={set("type")} className="px-4 py-2.5 bg-muted rounded-xl outline-none">
            <option value="land">Land</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option><option value="farm">Farm</option>
          </select>
          <input required type="number" placeholder="Price USD" value={form.price_usd} onChange={set("price_usd")} className="px-4 py-2.5 bg-muted rounded-xl outline-none" />
          <input required placeholder="Country" value={form.country} onChange={set("country")} className="px-4 py-2.5 bg-muted rounded-xl outline-none" />
          <input placeholder="City" value={form.city} onChange={set("city")} className="px-4 py-2.5 bg-muted rounded-xl outline-none" />
        </div>
        <input placeholder="Cover image URL" value={form.cover_url} onChange={set("cover_url")} className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none" />
        <button disabled={busy} className="w-full bg-primary text-primary-foreground rounded-full py-3 font-medium disabled:opacity-50">{busy ? "…" : "Publish"}</button>
      </form>
    </div>
  );
}
