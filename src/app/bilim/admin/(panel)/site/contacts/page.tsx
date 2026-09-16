import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { getContacts } from "@/lib/site-settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContactsForm } from "@/components/admin/site/contacts-form";

export const metadata: Metadata = { title: "Контакты" };

export default async function SiteContactsPage() {
  await requireRole("ADMIN");
  const contacts = await getContacts();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт"
        title="Контакты"
        description="Телефон, email, адрес и часы работы. Они показываются в подвале каждой страницы и на странице «Контакты»."
      />
      <div className="mt-8">
        <ContactsForm initial={contacts} />
      </div>
    </div>
  );
}
