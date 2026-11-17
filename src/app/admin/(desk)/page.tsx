import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
import { DeskOverview, type OverviewData } from "@/components/admin/desk-overview";
import { programChoices, programLook, programName } from "@/lib/palette";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const store = getStore();
  const [batches, registrations, fees, assignments, teachers, pays] = await Promise.all([
    store.listBatches(),
    store.listRegistrations(),
    store.listFees(),
    store.listAssignments(),
    store.listFaculty(),
    store.listFacultyPays(),
  ]);
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const real = registrations.filter((item) => !item.sample);
  const batchOf = (id: string) => batches.find((batch) => batch.id === id);

  const data: OverviewData = {
    students: members.filter((member) => batchOf(member.batchId)?.learnerType === "student").length,
    professionals: members.filter((member) => batchOf(member.batchId)?.learnerType === "professional").length,
    siteStudents: real.filter((item) => item.learnerType === "student").length,
    siteProfessionals: real.filter((item) => item.learnerType === "professional").length,
    presentToday: marks.filter((mark) => mark.date === today && mark.status === "present").length,
    absentToday: marks.filter((mark) => mark.date === today && mark.status === "absent").length,
    openAssignments: assignments.filter((item) => item.status !== "reviewed").length,
    programs: programChoices.map((choice) => ({
      slug: choice.slug,
      name: choice.name,
      count: real.filter((item) => item.program === choice.slug).length,
      from: programLook(choice.slug).from,
      to: programLook(choice.slug).to,
    })),
    leads: real.map((item) => ({
      at: item.createdAt,
      name: item.fullName,
      learnerType: item.learnerType,
      program: programName(item.program),
      status: item.status,
    })),
    fees: fees.map((fee) => {
      const batch = batchOf(fee.batchId);
      return {
        at: fee.paidOn,
        name: members.find((member) => member.id === fee.memberId)?.fullName || "Learner",
        amount: fee.amount,
        kind: fee.kind,
        who: batch?.learnerType || "student",
        batch: batch?.name || "Batch",
      };
    }),
    teacherPays: pays.map((pay) => {
      const teacher = teachers.find((item) => item.id === pay.teacherId);
      return {
        at: pay.classDate,
        name: teacher?.fullName || "Teacher",
        amount: pay.amount,
        status: pay.status,
        course: teacher ? programName(teacher.course) : "Course",
      };
    }),
  };

  return (
    <div>
      <DeskHeader
        eyebrow="New batch"
        title={<DeskTitle />}
        subtitle="Payments, registrations, students, and professionals in one view."
      />
      <div className="mt-4">
        <DeskOverview data={data} />
      </div>
    </div>
  );
}
