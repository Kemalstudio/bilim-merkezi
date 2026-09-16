"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { resetSiteSettingAction, saveSiteSettingAction } from "@/actions/admin-site";
import { DEFAULT_CONTACTS, contactsSchema, type ContactSettings } from "@/lib/site-settings-schema";

const FIELDS = [
  { key: "phone", label: "Телефон", icon: Phone, type: "tel", hint: "По нажатию на сайте сразу начинается звонок." },
  { key: "email", label: "Email", icon: Mail, type: "email", hint: "Открывает почтовую программу посетителя." },
  { key: "address", label: "Адрес", icon: MapPin, type: "text", hint: "Город или полный адрес центра." },
  { key: "hours", label: "Часы работы", icon: Clock, type: "text", hint: "Можно оставить пустым — тогда карточка скроется." },
] as const;

type Errors = Partial<Record<keyof ContactSettings, string>>;

export function ContactsForm({ initial }: { initial: ContactSettings }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const { pending, run } = useSettingSaver();

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  function save() {
    const parsed = contactsSchema.safeParse(value);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactSettings;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    run(() => saveSiteSettingAction("contacts", parsed.data), "Контакты сохранены", () => {
      setValue(parsed.data);
      setSaved(parsed.data);
    });
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4 rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:grid-cols-2 sm:p-7">
          {FIELDS.map(({ key, label, icon: Icon, type, hint }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`contact-${key}`} className="text-sm font-semibold text-ink-soft">
                {label}
              </label>
              <div className="relative">
                <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id={`contact-${key}`}
                  type={type}
                  value={value[key]}
                  onChange={(event) => setValue((current) => ({ ...current, [key]: event.target.value }))}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={`contact-${key}-hint`}
                  className="pl-11"
                />
              </div>
              <p id={`contact-${key}-hint`} className={errors[key] ? "text-xs font-semibold text-rose" : "text-xs text-muted"}>
                {errors[key] ?? hint}
              </p>
            </div>
          ))}
        </div>

        <aside className="paper-noise relative h-fit overflow-hidden rounded-[1.4rem] bg-panel p-6 text-white">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-30" />
          <p className="relative text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-accent">Так в подвале сайта</p>
          <div className="relative mt-5 flex flex-col gap-2.5 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-accent" /> {value.address || "—"}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-accent" /> {value.email || "—"}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-accent" /> {value.phone || "—"}
            </span>
            {value.hours && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-accent" /> {value.hours}
              </span>
            )}
          </div>
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={save}
        onDiscard={() => {
          setValue(saved);
          setErrors({});
        }}
        onReset={() =>
          run(() => resetSiteSettingAction("contacts"), "Контакты возвращены к исходным", () => {
            setValue(DEFAULT_CONTACTS);
            setSaved(DEFAULT_CONTACTS);
            setErrors({});
          })
        }
      />
    </>
  );
}
