import {
  getSignupsByDay,
  getApplicationsByDay,
  getResponseRate,
  getApplicationStatusBreakdown,
  getPlatformOverview,
} from "@/lib/adminQueries";
import AdminTimeSeriesChart from "@/components/AdminTimeSeriesChart";

export default async function AdminAnalyticsPage() {
  const [signups, applicationsByDay, responseRate, statusBreakdown, overview] = await Promise.all([
    getSignupsByDay(30),
    getApplicationsByDay(30),
    getResponseRate(),
    getApplicationStatusBreakdown(),
    getPlatformOverview(),
  ]);

  const signupData = signups.map((s: any) => ({
    day: s.day,
    Candidates: Number(s.candidates),
    Companies: Number(s.companies),
  }));
  const applicationData = applicationsByDay.map((a: any) => ({
    day: a.day,
    Applications: Number(a.applications),
  }));

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Analytics</h1>
      <p className="text-sm text-muted mt-1">Last 30 days — useful for internal tracking and investor updates.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Total candidates</p>
          <p className="font-display font-semibold text-2xl mt-1">{overview.candidates}</p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Total companies</p>
          <p className="font-display font-semibold text-2xl mt-1">{overview.companies}</p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Active jobs</p>
          <p className="font-display font-semibold text-2xl mt-1">{overview.activeJobs}</p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-white">
          <p className="text-xs text-muted">Response rate</p>
          <p className="font-display font-semibold text-2xl mt-1">{responseRate.rate}%</p>
          <p className="text-xs text-muted mt-0.5">
            {responseRate.responded} of {responseRate.total} applications got a company reply
          </p>
        </div>
      </div>

      <div className="mt-8 p-5 rounded-xl border border-line bg-white">
        <h2 className="text-sm font-medium">Signups per day</h2>
        <AdminTimeSeriesChart
          data={signupData}
          lines={[
            { key: "Candidates", label: "Candidates" },
            { key: "Companies", label: "Companies" },
          ]}
        />
      </div>

      <div className="mt-6 p-5 rounded-xl border border-line bg-white">
        <h2 className="text-sm font-medium">Applications sent per day</h2>
        <AdminTimeSeriesChart data={applicationData} lines={[{ key: "Applications", label: "Applications" }]} />
      </div>

      <div className="mt-6 p-5 rounded-xl border border-line bg-white">
        <h2 className="text-sm font-medium">Application status breakdown</h2>
        <div className="flex flex-wrap gap-4 mt-3">
          {statusBreakdown.map((s) => (
            <div key={s.status} className="flex items-center gap-2">
              <span className="text-sm text-muted">{s.status}:</span>
              <span className="text-sm font-medium">{Number(s.count)}</span>
            </div>
          ))}
          {statusBreakdown.length === 0 && <p className="text-sm text-muted">No applications yet.</p>}
        </div>
      </div>
    </div>
  );
}
