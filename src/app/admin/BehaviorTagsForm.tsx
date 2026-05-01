"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, X } from "lucide-react";
import { BEHAVIOR_TAGS, BEHAVIOR_TAG_COLORS } from "@/lib/constants";

interface BehaviorTagsFormProps {
  playerId: string;
}

export default function BehaviorTagsForm({ playerId }: BehaviorTagsFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchTags() {
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.behaviorTags) {
          try {
            const parsed = JSON.parse(data.behaviorTags);
            if (Array.isArray(parsed)) {
              setSelectedTags(parsed);
            }
          } catch {
            // fallback: comma separated
            setSelectedTags(data.behaviorTags.split(",").map((t: string) => t.trim()).filter(Boolean));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTags() {
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ behaviorTags: JSON.stringify(selectedTags) }),
      });

      if (res.ok) {
        toast.success("Behavior tags saved");
      } else {
        toast.error("Failed to save tags");
      }
    } catch (error) {
      console.error("Error saving tags:", error);
      toast.error("Failed to save tags");
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-text-muted" />
        <p className="text-sm text-text-muted mt-2">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Selected Tags */}
      <div>
        <h4 className="text-sm font-semibold text-text-heading mb-2">
          Selected Tags ({selectedTags.length})
        </h4>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`cursor-pointer ${BEHAVIOR_TAG_COLORS[tag] || "bg-surface-hover text-text-heading border-border"}`}
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-body">No tags selected</p>
        )}
      </div>

      {/* Available Tags */}
      <div>
        <h4 className="text-sm font-semibold text-text-heading mb-2">
          Available Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {BEHAVIOR_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "bg-surface-elevated text-text-heading hover:bg-secondary"
                    : BEHAVIOR_TAG_COLORS[tag] || "bg-gray-50 text-text-muted border-border hover:bg-surface-hover"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>

      <Button
        className="bg-surface-elevated text-text-heading hover:bg-secondary"
        onClick={saveTags}
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Tags
      </Button>
    </div>
  );
}

