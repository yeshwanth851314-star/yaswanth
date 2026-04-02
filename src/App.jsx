import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const GOLD = "#F5A623", NAVY = "#1A2657", LIGHT = "#F0F4FF";
const catColors = { Social: "#26BDE2", Environmental: "#4C9F38", Economic: "#F5A623", Governance: "#1A2657" };

const rawData = [
  { id:1, icon:"🏚️", name:"No Poverty", category:"Social", score:60, target:85, color:"#E5243B" },
  { id:2, icon:"🌾", name:"Zero Hunger", category:"Social", score:52, target:80, color:"#DDA63A" },
  { id:3, icon:"💊", name:"Good Health", category:"Social", score:58, target:85, color:"#4C9F38" },
  { id:4, icon:"📚", name:"Quality Education", category:"Social", score:64, target:90, color:"#C5192D" },
  { id:5, icon:"♀️", name:"Gender Equality", category:"Social", score:48, target:80, color:"#FF3A21" },
  { id:6, icon:"💧", name:"Clean Water", category:"Environmental", score:67, target:90, color:"#26BDE2" },
  { id:7, icon:"⚡", name:"Clean Energy", category:"Environmental", score:71, target:95, color:"#FCC30B" },
  { id:8, icon:"💼", name:"Decent Work", category:"Economic", score:55, target:80, color:"#A21942" },
  { id:9, icon:"🏭", name:"Industry & Innovation", category:"Economic", score:50, target:85, color:"#FD6925" },
  { id:10, icon:"⚖️", name:"Reduced Inequalities", category:"Social", score:43, target:75, color:"#DD1367" },
  { id:11, icon:"🏙️", name:"Sustainable Cities", category:"Environmental", score:46, target:80, color:"#FD9D24" },
  { id:12, icon:"♻️", name:"Responsible Consumption", category:"Environmental", score:54, target:85, color:"#BF8B2E" },
  { id:13, icon:"🌍", name:"Climate Action", category:"Environmental", score:62, target:90, color:"#3F7E44" },
  { id:14, icon:"🐟", name:"Life Below Water", category:"Environmental", score:41, target:75, color:"#0A97D9" },
  { id:15, icon:"🌳", name:"Life on Land", category:"Environmental", score:49, target:80, color:"#56C02B" },
  { id:16, icon:"🕊️", name:"Peace & Justice", category:"Governance", score:57, target:85, color:"#00689D" },
  { id:17, icon:"🤝", name:"Partnerships", category:"Governance", score:69, target:90, color:"#19486A" },
];

const getStatus = s => s >= 65 ? "On Track" : s >= 50 ? "Needs Attention" : "Critical";
const getStatusColor = s => s >= 65 ? "#4C9F38" : s >= 50 ? GOLD : "#E5243B";
const getStatusBg = s => s >= 65 ? "#d4f0ca" : s >= 50 ? "#fff3cc" : "#fde0e0";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0, end = value, dur = 800, step = 16;
    const inc = (end - start) / (dur / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

function ProgressBar({ score, color, animate }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), animate ? 300 : 0);
    return () => clearTimeout(t);
  }, [score, animate]);
  return (
    <div style={{ background: "#eee", borderRadius: 8, height: 10, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${width}%`, background: color, height: 10, borderRadius: 8, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(rawData);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const processed = data.map(d => ({ ...d, status: getStatus(d.score), gap: d.target - d.score }));
  const filtered = processed
    .filter(d => (!search || d.name.toLowerCase().includes(search.toLowerCase())))
    .filter(d => (!catFilter || d.category === catFilter))
    .filter(d => (!statusFilter || d.status === statusFilter))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return typeof av === "string" ? sortDir * av.localeCompare(bv) : sortDir * (av - bv);
    });

  const avg = Math.round(processed.reduce((a, b) => a + b.score, 0) / processed.length);
  const onTrack = processed.filter(d => d.status === "On Track").length;
  const needs = processed.filter(d => d.status === "Needs Attention").length;
  const crit = processed.filter(d => d.status === "Critical").length;

  const cats = ["Social", "Environmental", "Economic", "Governance"];
  const catAvgs = cats.map(c => {
    const items = processed.filter(d => d.category === c);
    return { name: c, score: Math.round(items.reduce((a, b) => a + b.score, 0) / items.length), fill: catColors[c] };
  });
  const pieData = [
    { name: "On Track", value: onTrack, fill: "#4C9F38" },
    { name: "Needs Attention", value: needs, fill: GOLD },
    { name: "Critical", value: crit, fill: "#E5243B" },
  ];

  const updateScore = (id, val) => {
    const v = Math.min(100, Math.max(0, parseInt(val) || 0));
    setData(prev => prev.map(d => d.id === id ? { ...d, score: v } : d));
  };

  const sort = key => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(1); }
  };

  const exportCSV = () => {
    const header = "SDG No.,Goal,Category,Score,Status,Target 2030,Gap\n";
    const body = filtered.map(d => `${d.id},${d.name},${d.category},${d.score},${d.status},${d.target},${d.gap}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "SDG_India.csv"; a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(90deg, ${NAVY} 0%, #243680 100%)`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: GOLD, color: NAVY, fontWeight: 900, fontSize: 18, borderRadius: 10, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${GOLD}88`, animation: "pulse 2s infinite" }}>LPU</div>
          <div>
            <div style={{ color: GOLD, fontWeight: 800, fontSize: 17 }}>Lovely Professional University</div>
            <div style={{ color: "#aab4d4", fontSize: 12 }}>🌱 SDG Progress Dashboard — India 2025</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["overview", "table", "charts"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? GOLD : "rgba(255,255,255,0.1)", color: tab === t ? NAVY : "#aab4d4", border: "none", padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.3s", transform: tab === t ? "scale(1.05)" : "scale(1)" }}>
              {t === "overview" ? "📊 Overview" : t === "table" ? "📋 Data Table" : "📈 Charts"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "20px 24px 0" }}>
        {[
          { label: "Avg Score", value: avg, suffix: "/100", color: GOLD, icon: "📈", sub: "India 2025" },
          { label: "On Track", value: onTrack, suffix: " goals", color: "#4C9F38", icon: "✅", sub: "Score ≥ 65" },
          { label: "Needs Attention", value: needs, suffix: " goals", color: GOLD, icon: "⚠️", sub: "Score 50–64" },
          { label: "Critical", value: crit, suffix: " goals", color: "#E5243B", icon: "❌", sub: "Score < 50" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 18, borderTop: `4px solid ${c.color}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transform: loaded ? "translateY(0)" : "translateY(30px)", opacity: loaded ? 1 : 0, transition: `all 0.5s ease ${i * 0.1}s` }}>
            <div style={{ fontSize: 24 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color, marginTop: 6 }}><AnimatedNumber value={c.value} /><span style={{ fontSize: 14, fontWeight: 500, color: "#888" }}>{c.suffix}</span></div>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 16 }}>🎯 All 17 SDGs — Live Progress</div>
            {processed.map((s, i) => (
              <div key={s.id} style={{ marginBottom: 14, opacity: loaded ? 1 : 0, transform: loaded ? "translateX(0)" : "translateX(-20px)", transition: `all 0.4s ease ${i * 0.04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 5 }}>
                  <span>{s.icon} SDG {s.id} — {s.name}</span>
                  <span style={{ color: getStatusColor(s.score), fontWeight: 800 }}>{s.score}/100</span>
                </div>
                <ProgressBar score={s.score} color={s.color} animate={loaded} />
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                  {s.score >= 65 ? "✅ On Track" : s.score >= 50 ? "⚠️ Needs Attention" : "❌ Critical"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Tab */}
      {tab === "table" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search goal..." style={{ border: "1px solid #ccd5f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", flex: 1, minWidth: 150 }} />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ border: "1px solid #ccd5f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
              <option value="">All Categories</option>
              {["Social","Environmental","Economic","Governance"].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: "1px solid #ccd5f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
              <option value="">All Status</option>
              {["On Track","Needs Attention","Critical"].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setSearch(""); setCatFilter(""); setStatusFilter(""); }} style={{ background: NAVY, color: GOLD, border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>↺ Reset</button>
            <button onClick={exportCSV} style={{ background: "#4C9F38", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>⬇ Export CSV</button>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  {[["id","No."],["name","Goal"],["category","Category"],["score","Score"],["status","Status"],["target","Target"],["gap","Gap"]].map(([k,l]) => (
                    <th key={k} onClick={() => sort(k)} style={{ padding: "12px 14px", color: GOLD, textAlign: "left", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                      {l} {sortKey === k ? (sortDir === 1 ? "↑" : "↓") : "↕"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} onMouseEnter={() => setHoveredRow(d.id)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: "1px solid #e8edf8", background: hoveredRow === d.id ? "#f5f7ff" : "#fff", transition: "background 0.2s", opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(10px)", animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{d.icon} {d.id}</td>
                    <td style={{ padding: "10px 14px" }}>{d.name}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: catColors[d.category] + "22", color: catColors[d.category], padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{d.category}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="number" value={d.score} min={0} max={100} onChange={e => updateScore(d.id, e.target.value)}
                          style={{ width: 52, border: `1px solid ${getStatusColor(d.score)}`, borderRadius: 6, padding: "3px 6px", fontSize: 12, fontWeight: 700, textAlign: "center", outline: "none", color: getStatusColor(d.score) }} />
                        <div style={{ background: "#eee", borderRadius: 6, height: 8, width: 70, overflow: "hidden" }}>
                          <div style={{ width: `${d.score}%`, background: d.color, height: 8, borderRadius: 6, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: getStatusBg(d.score), color: getStatusColor(d.score), padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{d.status}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{d.target}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 800, color: d.gap > 30 ? "#E5243B" : d.gap > 20 ? GOLD : "#4C9F38" }}>{d.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {tab === "charts" && (
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", gridColumn: "1/-1" }}>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 14 }}>📊 All 17 SDGs — Score Comparison</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={processed} margin={{ left: -20, right: 10 }}>
                <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n, p) => [`${v}/100`, p.payload.name]} labelFormatter={l => `SDG ${l}`} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1000}>
                  {processed.map(s => <Cell key={s.id} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 14 }}>📂 Avg Score by Category</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catAvgs} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}/100`]} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200}>
                  {catAvgs.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 14 }}>🍩 Status Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" isAnimationActive animationDuration={1000} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", padding: "16px", fontSize: 11, color: "#aaa" }}>
        Data based on India SDG Index estimates • LPU CHE110 — Environmental Studies • 2025
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 20px ${GOLD}88} 50%{box-shadow:0 0 35px ${GOLD}cc} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
