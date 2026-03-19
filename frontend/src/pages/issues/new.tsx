import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "react-query";
import Head from "next/head";
import Link from "next/link";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { issuesApi, metaApi } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/FormFields";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

interface EvidenceItem {
  evidence_type: "image" | "link" | "document";
  url: string;
  caption: string;
}

export default function CreateIssuePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [jurisdictionId, setJurisdictionId] = useState("");
  const [govBodyId, setGovBodyId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Canada");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories } = useQuery("categories", () =>
    metaApi.categories().then((r) => r.data)
  );
  const { data: jurisdictions } = useQuery("jurisdictions", () =>
    metaApi.jurisdictions().then((r) => r.data)
  );
  const { data: govBodies } = useQuery(
    ["gov-bodies", jurisdictionId],
    () => metaApi.governmentBodies(Number(jurisdictionId)).then((r) => r.data),
    { enabled: !!jurisdictionId }
  );

  const mutation = useMutation(
    () =>
      issuesApi.create({
        title,
        description,
        category_id: Number(categoryId),
        jurisdiction_id: Number(jurisdictionId),
        government_body_id: govBodyId ? Number(govBodyId) : undefined,
        address: address || undefined,
        city: city || undefined,
        province: province || undefined,
        country: country || "Canada",
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        evidence: evidence.filter((e) => e.url),
      }),
    {
      onSuccess: (res) => {
        router.push(`/issues/${res.data.id}`);
      },
    }
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.length < 5) errs.title = "Title must be at least 5 characters";
    if (!description.trim() || description.length < 10)
      errs.description = "Description must be at least 10 characters";
    if (!categoryId) errs.category = "Please select a category";
    if (!jurisdictionId) errs.jurisdiction = "Please select a jurisdiction";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const addEvidence = () =>
    setEvidence((prev) => [...prev, { evidence_type: "link", url: "", caption: "" }]);

  const removeEvidence = (i: number) =>
    setEvidence((prev) => prev.filter((_, idx) => idx !== i));

  const updateEvidence = (i: number, patch: Partial<EvidenceItem>) =>
    setEvidence((prev) => prev.map((ev, idx) => (idx === i ? { ...ev, ...patch } : ev)));

  if (!authLoading && !user) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-600">You must be signed in to report an issue.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Report an Issue | PublicBoard</title>
      </Head>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> Back to issues
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">Report a Public Issue</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Issue Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Title *"
                placeholder="Brief, specific title (e.g. 'Broken streetlight on Main St')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
              <Textarea
                label="Description *"
                placeholder="Describe the problem in detail. What is happening? Why is it a problem? Who is affected?"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors.description}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Category *"
                  options={(categories ?? []).map((c) => ({
                    value: c.id,
                    label: `${c.icon ?? ""} ${c.name}`,
                  }))}
                  placeholder="Select category…"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  error={errors.category}
                />
                <Select
                  label="Jurisdiction *"
                  options={(jurisdictions ?? []).map((j) => ({
                    value: j.id,
                    label: `${j.name} (${j.level})`,
                  }))}
                  placeholder="Select jurisdiction…"
                  value={jurisdictionId}
                  onChange={(e) => {
                    setJurisdictionId(e.target.value);
                    setGovBodyId("");
                  }}
                  error={errors.jurisdiction}
                />
              </div>
              {govBodies && govBodies.length > 0 && (
                <Select
                  label="Government Body (optional)"
                  options={govBodies.map((b) => ({ value: b.id, label: b.name }))}
                  placeholder="Select government body…"
                  value={govBodyId}
                  onChange={(e) => setGovBodyId(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Location (optional)</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Street address"
                placeholder="123 Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="City"
                  placeholder="Toronto"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="Province"
                  placeholder="Ontario"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Latitude"
                  type="number"
                  placeholder="43.6532"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <Input
                  label="Longitude"
                  type="number"
                  placeholder="-79.3832"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Evidence (optional)</h2>
              <Button type="button" variant="outline" size="sm" onClick={addEvidence}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardHeader>
            {evidence.length > 0 && (
              <CardContent className="space-y-3">
                {evidence.map((ev, i) => (
                  <div key={i} className="flex gap-3 items-start rounded-md border border-gray-200 p-3">
                    <div className="flex-1 space-y-2">
                      <Select
                        label="Type"
                        options={[
                          { value: "link", label: "Link" },
                          { value: "image", label: "Image URL" },
                          { value: "document", label: "Document" },
                        ]}
                        value={ev.evidence_type}
                        onChange={(e) =>
                          updateEvidence(i, {
                            evidence_type: e.target.value as EvidenceItem["evidence_type"],
                          })
                        }
                      />
                      <Input
                        label="URL"
                        placeholder="https://…"
                        value={ev.url}
                        onChange={(e) => updateEvidence(i, { url: e.target.value })}
                      />
                      <Input
                        label="Caption"
                        placeholder="Brief description"
                        value={ev.caption}
                        onChange={(e) => updateEvidence(i, { caption: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(i)}
                      className="mt-6 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Error from API */}
          {mutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              Failed to submit issue. Please check your input and try again.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={mutation.isLoading}>
              Submit Issue
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
