"use client";

/**
 * YANGILIK TAHRIRLASH OYNASI — yaratish va o'zgartirish.
 *
 * ⚠️ "NASHR ETISH" ALOHIDA BAYROQ: qoralama saqlab, keyin nashr qilish
 * mumkin. Nashr etilmagani ilovada ko'rinmaydi.
 */

import { useState } from "react";

import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from "@/features/announcements/api";
import { useDistricts } from "@/features/territory/api";
import type { Announcement } from "@/shared/api/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Spinner } from "@/shared/ui/states";

const PROVINCE = "__province__";

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

export const AnnouncementDialog = ({ announcement, onClose }: Props) => {
  const editing = Boolean(announcement);
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const districts = useDistricts();

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [districtId, setDistrictId] = useState(announcement?.districtId ?? null);
  const [isPinned, setIsPinned] = useState(announcement?.isPinned ?? false);
  const [publish, setPublish] = useState(Boolean(announcement?.publishedAt) || !editing);

  const pending = create.isPending || update.isPending;
  const canSave = title.trim().length >= 3 && body.trim().length >= 3;

  const handleSave = () => {
    const payload = {
      title: title.trim(),
      body: body.trim(),
      districtId: districtId ?? undefined,
      isPinned,
      publish,
    };

    if (announcement) {
      update.mutate({ id: announcement.id, ...payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Yangilikni tahrirlash" : "Yangi yangilik"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Sarlavha</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Suv ta'minoti vaqtincha to'xtatiladi"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Matn</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Yangilik matni..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Hudud</Label>
            <Select
              value={districtId ?? PROVINCE}
              onValueChange={(value) => setDistrictId(value === PROVINCE ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROVINCE}>Butun viloyat</SelectItem>
                {districts.data?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Yuqoriga qadash</Label>
              <p className="text-xs text-muted-foreground">Ro&apos;yxat boshida turadi</p>
            </div>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Nashr etish</Label>
              <p className="text-xs text-muted-foreground">
                O&apos;chirilsa — qoralama (ilovada ko&apos;rinmaydi)
              </p>
            </div>
            <Switch checked={publish} onCheckedChange={setPublish} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button disabled={!canSave || pending} onClick={handleSave}>
            {pending ? <Spinner className="mr-1.5 size-4" /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
