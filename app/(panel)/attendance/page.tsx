import DayAttendance from "@/components/DayAttendance";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Attendance</h1>
          <p className="sub">Mark who came for training. Pick any date to review or fix a day.</p>
        </div>
      </div>
      <DayAttendance initialDate={date} />
    </>
  );
}
