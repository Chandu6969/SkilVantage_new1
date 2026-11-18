import { notFound } from "next/navigation";
import { TeacherDetail } from "@/components/admin/teacher-detail";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const [teachers, days, pays] = await Promise.all([store.listFaculty(), store.listFacultyDays(), store.listFacultyPays()]);
  const teacher = teachers.find((item) => item.id === id);
  if (!teacher) notFound();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  return (
    <TeacherDetail
      teacher={teacher}
      days={days.filter((item) => item.teacherId === teacher.id)}
      pays={pays.filter((item) => item.teacherId === teacher.id)}
      today={today}
    />
  );
}
