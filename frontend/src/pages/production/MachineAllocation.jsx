import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cpu,
  Download,
  GripVertical,
  RefreshCw,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import {
  assignAllocation,
  getAllocationMachines,
  getAllocationSummary,
  getAllocations,
} from "../../api/productionApi";
import {
  ALLOC_FLOW_STEPS,
  DEMO_ALLOC_SUMMARY,
  DEMO_ALLOCATIONS,
  DEMO_MACHINE_AVAIL,
  DEMO_UNASSIGNED,
  priorityStyle,
} from "../../data/machineAllocationMasterData";
import { exportToExcel } from "../../utils/exportUtils";

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MachineAllocation() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_ALLOC_SUMMARY);
  const [allocations, setAllocations] = useState([]);
  const [machines, setMachines] = useState(DEMO_MACHINE_AVAIL);
  const [unassigned, setUnassigned] = useState(DEMO_UNASSIGNED);
  const [dragWo, setDragWo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes, machRes] = await Promise.allSettled([
        getAllocationSummary(),
        getAllocations(),
        getAllocationMachines(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        setSummary({ ...DEMO_ALLOC_SUMMARY, ...sumRes.value.data });
      }
      if (listRes.status === "fulfilled" && listRes.value?.data?.length) {
        setAllocations(listRes.value.data);
        setUnassigned(
          listRes.value.data
            .filter((r) => !r.machine_id || r.status === "unassigned")
            .map((r) => ({
              work_order_id: r.work_order_id,
              work_order_number: r.work_order_number,
              product_name: r.product_name,
              priority: r.priority,
            }))
        );
      }
      if (machRes.status === "fulfilled" && machRes.value?.data?.length) {
        setMachines(machRes.value.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (machineId, machineName) => {
    if (!dragWo) return;
    const numericWo = typeof dragWo.work_order_id === "number";
    const numericMachine = typeof machineId === "number";
    if (numericWo && numericMachine) {
      try {
        const res = await assignAllocation({
          work_order_id: dragWo.work_order_id,
          machine_id: machineId,
        });
        if (res.data?.success) {
          addToast(res.data.message, "success");
          load();
          return;
        }
        addToast(res.data?.message || "Assignment failed", "error");
        return;
      } catch {
        addToast("Assignment failed — updating locally", "warning");
      }
    }
    setAllocations((prev) =>
      prev.map((r) =>
        r.work_order_id === dragWo.work_order_id
          ? { ...r, machine_id: machineId, machine_name: machineName, status: "planned" }
          : r
      )
    );
    setUnassigned((prev) => prev.filter((u) => u.work_order_id !== dragWo.work_order_id));
    addToast(`Assigned ${dragWo.work_order_number} to ${machineName}`, "success");
    setDragWo(null);
  };

  const columns = [
    { key: "work_order_number", label: "Work Order" },
    { key: "product_name", label: "Product" },
    { key: "machine_name", label: "Machine", render: (r) => r.machine_name || "—" },
    { key: "operator_name", label: "Operator", render: (r) => r.operator_name || "—" },
    { key: "shift", label: "Shift", render: (r) => r.shift || "—" },
    { key: "supervisor", label: "Supervisor", render: (r) => r.supervisor || "—" },
    {
      key: "capacity_pct",
      label: "Capacity",
      render: (r) => (
        <div className="min-w-[80px]">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.capacity_pct}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">{r.capacity_pct}%</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
          {r.status}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    exportToExcel(allocations, columns.filter((c) => !c.render), "machine-allocation");
    addToast("Exported", "success");
  };

  if (loading) return <Loader label="Loading machine allocation..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Machine Allocation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign work orders to machines, operators, shifts, and supervisors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/production/work-orders" className="ui-btn-primary">View Work Orders</Link>
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Total Machines" value={summary.total_machines} icon={Cpu} color="bg-[#2563EB]" />
        <SummaryCard label="Allocated" value={summary.allocated} icon={Settings} color="bg-violet-500" />
        <SummaryCard label="Free Machines" value={summary.free_machines} icon={Cpu} color="bg-green-500" />
        <SummaryCard label="Under Maintenance" value={summary.under_maintenance} icon={Wrench} color="bg-red-500" />
        <SummaryCard label="Utilization %" value={`${summary.utilization_pct}%`} icon={Users} color="bg-amber-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-800">Allocation Table</h2>
            <DataTable columns={columns} data={allocations} searchKeys={["work_order_number", "product_name", "machine_name"]} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Drag & Drop Allocation</h2>
            <div className="mb-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">Unassigned Work Orders</p>
              <div className="flex flex-wrap gap-2">
                {unassigned.map((u) => (
                  <div
                    key={u.work_order_id}
                    draggable
                    onDragStart={() => setDragWo(u)}
                    className="flex cursor-grab items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm active:cursor-grabbing"
                  >
                    <GripVertical className="h-3 w-3 text-slate-400" />
                    {u.work_order_number} · {u.product_name}
                  </div>
                ))}
                {unassigned.length === 0 && (
                  <p className="text-xs text-slate-400">All work orders allocated</p>
                )}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {machines.map((m) => (
                <div
                  key={m.machine_id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(m.machine_id, m.machine_name)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-violet-400 hover:bg-violet-50"
                >
                  <p className="text-sm font-bold text-slate-800">{m.machine_name}</p>
                  <p className="text-[10px] capitalize text-slate-500">{m.status}</p>
                  {m.current_job && <p className="text-[10px] text-violet-600">{m.current_job}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Machine Availability</h3>
            <div className="space-y-2 text-xs">
              {machines.map((m) => (
                <div key={m.machine_id} className="rounded-lg border border-slate-100 p-2">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{m.machine_name}</span>
                    <span className="capitalize text-slate-500">{m.status}</span>
                  </div>
                  <p className="text-slate-500">Free: {m.free_time || "—"} · Job: {m.current_job || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Utilization Chart</h3>
            <div className="space-y-3">
              {machines.slice(0, 5).map((m) => (
                <div key={m.machine_id}>
                  <div className="mb-0.5 flex justify-between text-xs text-slate-600">
                    <span>{m.machine_name}</span>
                    <span>{m.utilization_pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${m.utilization_pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 px-4 py-3">
        {ALLOC_FLOW_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-violet-600">{step}</span>
            {i < ALLOC_FLOW_STEPS.length - 1 && <span className="text-slate-300">↓</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
