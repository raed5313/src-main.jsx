
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const KEY = "akademi_school_v1";

const initialData = {
  students: [],
  teachers: [],
  classes: [],
  attendance: {},
};

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:Tahoma,Arial,sans-serif;background:#f3f6fb;color:#17243b}
button,input,select{font:inherit}
button{cursor:pointer;border:0;border-radius:9px;padding:10px 14px}
.app{min-height:100vh}
.top{background:#142b4d;color:white;padding:19px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.brand{font-size:22px;font-weight:bold}.sub{font-size:12px;color:#cbd8eb;margin-top:6px}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);min-height:calc(100vh - 80px)}
.side{background:#fff;padding:16px;border-left:1px solid #e1e7f0}
.nav{display:block;width:100%;text-align:right;background:transparent;color:#3a4b65;margin:4px 0;padding:12px}
.nav.active{background:#e8f0ff;color:#1454b8;font-weight:bold}
.main{padding:24px;min-width:0}
.heading{font-size:24px;font-weight:bold;margin:0 0 7px}
.muted{color:#6c7b91;font-size:13px;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
.card,.panel{background:white;border:1px solid #e2e8f1;border-radius:14px;padding:17px;box-shadow:0 3px 12px #15274408}
.metric{font-size:26px;font-weight:bold;margin-top:10px;color:#183d70}
.label{color:#718096;font-size:13px}
.panel{margin-bottom:18px}
.panel-title{font-weight:bold;font-size:17px;margin-bottom:15px}
.form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}
input,select{width:100%;padding:11px;border:1px solid #d6deea;border-radius:9px;background:white;min-width:0;color:#17243b}
.primary{background:#1d5fc7;color:white}.danger{background:#fff0f0;color:#b42318}
.light{background:#eaf0f8;color:#2a4568}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:620px}
th,td{padding:12px 9px;text-align:right;border-bottom:1px solid #edf0f5;font-size:13px}
th{background:#f7f9fc;color:#5b6b82;white-space:nowrap}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.small{padding:7px 9px;font-size:12px}
.badge{display:inline-block;border-radius:20px;padding:5px 9px;background:#e8f7ee;color:#187344;font-size:12px}
.empty{text-align:center;padding:28px;color:#8290a3}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.row input{flex:1;min-width:160px}
.notice{background:#fff8e5;border:1px solid #f1dfa6;color:#785b13;padding:12px;border-radius:10px;font-size:13px;margin-bottom:16px}
@media(max-width:850px){.layout{grid-template-columns:1fr}.side{display:flex;gap:5px;overflow-x:auto;padding:8px;border-left:0;border-bottom:1px solid #e1e7f0}.nav{white-space:nowrap;width:auto;margin:0}.main{padding:14px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.form{grid-template-columns:1fr 1fr}.top{padding:15px}.brand{font-size:19px}}
@media(max-width:420px){.form{grid-template-columns:1fr}.grid{gap:8px}.card{padding:12px}.metric{font-size:22px}}
@media print{.top,.side,.no-print,.notice{display:none!important}.layout{display:block}.main{padding:0}.panel,.card{box-shadow:none;break-inside:avoid}body{background:white}.grid{grid-template-columns:repeat(4,1fr)}}
`;

function loadData() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  } catch {
    return initialData;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState("home");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [studentForm, setStudentForm] = useState({
    name: "", grade: "", section: "", phone: "", fee: "0",
  });
  const [teacherForm, setTeacherForm] = useState({
    name: "", subject: "", phone: "",
  });
  const [classForm, setClassForm] = useState({
    name: "", grade: "", teacher: "",
  });
  const [payments, setPayments] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setNotice("تعذر الحفظ. قد تكون مساحة التخزين ممتلئة.");
    }
  }, [data]);

  const update = (key, value) =>
    setData(old => ({ ...old, [key]: value }));

  const money = n => Number(n || 0).toLocaleString("en-US") + " د.ع";

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.students.filter(s =>
      [s.name, s.grade, s.section, s.phone].some(v =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [data.students, query]);

  const totalFees = data.students.reduce((sum, s) => sum + Number(s.fee || 0), 0);
  const totalPaid = data.students.reduce((sum, s) => sum + Number(s.paid || 0), 0);
  const totalDue = totalFees - totalPaid;

  function addStudent(e) {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      setNotice("يرجى إدخال اسم الطالب.");
      return;
    }
    const fee = Math.max(0, Number(studentForm.fee || 0));
    update("students", [
      ...data.students,
      {
        id: crypto.randomUUID(),
        ...studentForm,
        name: studentForm.name.trim(),
        fee,
        paid: 0,
      },
    ]);
    setStudentForm({ name: "", grade: "", section: "", phone: "", fee: "0" });
    setNotice("تمت إضافة الطالب بنجاح.");
  }

  function addTeacher(e) {
    e.preventDefault();
    if (!teacherForm.name.trim()) {
      setNotice("يرجى إدخال اسم المعلم.");
      return;
    }
    update("teachers", [
      ...data.teachers,
      { id: crypto.randomUUID(), ...teacherForm },
    ]);
    setTeacherForm({ name: "", subject: "", phone: "" });
    setNotice("تمت إضافة المعلم.");
  }

  function addClass(e) {
    e.preventDefault();
    if (!classForm.name.trim()) {
      setNotice("يرجى إدخال اسم الصف أو الشعبة.");
      return;
    }
    update("classes", [
      ...data.classes,
      { id: crypto.randomUUID(), ...classForm },
    ]);
    setClassForm({ name: "", grade: "", teacher: "" });
    setNotice("تمت إضافة الصف أو الشعبة.");
  }

  function removeItem(key, id, name) {
    if (!window.confirm(`هل تريد حذف ${name}؟`)) return;
    update(key, data[key].filter(item => item.id !== id));
    setNotice("تم الحذف.");
  }

  function editStudent(s) {
    const name = window.prompt("اسم الطالب:", s.name);
    if (name === null || !name.trim()) return;
    const phone = window.prompt("رقم الهاتف:", s.phone || "");
    if (phone === null) return;
    const grade = window.prompt("الصف:", s.grade || "");
    if (grade === null) return;
    const section = window.prompt("الشعبة:", s.section || "");
    if (section === null) return;
    update("students", data.students.map(item =>
      item.id === s.id
        ? { ...item, name: name.trim(), phone, grade, section }
        : item
    ));
    setNotice("تم تحديث بيانات الطالب.");
  }

  function recordPayment(s) {
    const amount = Number(payments[s.id] || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("أدخل مبلغ دفعة صحيحًا.");
      return;
    }
    if (amount > Number(s.fee) - Number(s.paid)) {
      setNotice("مبلغ الدفعة أكبر من المبلغ المتبقي.");
      return;
    }
    update("students", data.students.map(item =>
      item.id === s.id ? { ...item, paid: Number(item.paid) + amount } : item
    ));
    setPayments(old => ({ ...old, [s.id]: "" }));
    setNotice("تم تسجيل الدفعة.");
  }

  function markAttendance(studentId, status) {
    const key = `${date}_${studentId}`;
    update("attendance", { ...data.attendance, [key]: status });
  }

  function exportCSV() {
    const rows = [
      ["اسم الطالب", "الصف", "الشعبة", "الهاتف", "الأقساط", "المدفوع", "المتبقي"],
      ...data.students.map(s => [
        s.name, s.grade, s.section, s.phone, s.fee, s.paid,
        Number(s.fee) - Number(s.paid),
      ]),
    ];
    const csv = "\uFEFF" + rows.map(row =>
      row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "akademi-students.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function backup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "akademi-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function restore(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = JSON.parse(reader.result);
        if (!Array.isArray(restored.students) ||
            !Array.isArray(restored.teachers) ||
            !Array.isArray(restored.classes) ||
            typeof restored.attendance !== "object") {
          throw new Error("invalid");
        }
        if (window.confirm("سيتم استبدال البيانات الحالية بالنسخة المختارة. هل تريد المتابعة؟")) {
          setData({ ...initialData, ...restored });
          setNotice("تم استرجاع النسخة الاحتياطية.");
        }
      } catch {
        setNotice("ملف النسخة الاحتياطية غير صالح.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const nav = [
    ["home", "الرئيسية"],
    ["students", "إدارة الطلاب"],
    ["teachers", "إدارة المعلمين"],
    ["classes", "الصفوف والشعب"],
    ["attendance", "الحضور والغياب"],
    ["finance", "الأقساط والمدفوعات"],
    ["reports", "التقارير والطباعة"],
    ["settings", "النسخ الاحتياطي"],
  ];

  function StudentTable({ list }) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>اسم الطالب</th><th>الصف</th><th>الشعبة</th>
              <th>الهاتف</th><th>الأقساط</th><th>المدفوع</th>
              <th>المتبقي</th><th className="no-print">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.grade || "—"}</td>
                <td>{s.section || "—"}</td><td>{s.phone || "—"}</td>
                <td>{money(s.fee)}</td><td>{money(s.paid)}</td>
                <td>{money(Number(s.fee) - Number(s.paid))}</td>
                <td className="no-print">
                  <div className="actions">
                    <button className="light small" onClick={() => editStudent(s)}>تعديل</button>
                    <button className="danger small" onClick={() => removeItem("students", s.id, "الطالب")}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="empty">لا توجد بيانات لعرضها.</div>}
      </div>
    );
  }

  function Home() {
    return (
      <>
        <div className="grid">
          <div className="card"><div className="label">عدد الطلاب</div><div className="metric">{data.students.length}</div></div>
          <div className="card"><div className="label">عدد المعلمين</div><div className="metric">{data.teachers.length}</div></div>
          <div className="card"><div className="label">إجمالي الأقساط</div><div className="metric">{money(totalFees)}</div></div>
          <div className="card"><div className="label">المبالغ المستلمة</div><div className="metric">{money(totalPaid)}</div></div>
        </div>
        <div className="panel">
          <div className="panel-title">مرحبًا بك في نظام أكاديمي</div>
          <p>نظام مبسط لإدارة بيانات الطلاب والمعلمين والصفوف والحضور والأقساط.</p>
          <div className="row no-print">
            <button className="primary" onClick={() => setPage("students")}>إدارة الطلاب</button>
            <button className="light" onClick={() => setPage("attendance")}>تسجيل الحضور</button>
            <button className="light" onClick={() => setPage("reports")}>عرض التقارير</button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">ملخص مالي</div>
          <p>إجمالي المستحق: <b>{money(totalDue)}</b></p>
          <p>عدد الصفوف والشعب: <b>{data.classes.length}</b></p>
        </div>
      </>
    );
  }

  function Students() {
    return (
      <>
        <div className="panel no-print">
          <div className="panel-title">إضافة طالب جديد</div>
          <form onSubmit={addStudent}>
            <div className="form">
              <input placeholder="اسم الطالب *" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
              <input placeholder="الصف الدراسي" value={studentForm.grade} onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })} />
              <input placeholder="الشعبة" value={studentForm.section} onChange={e => setStudentForm({ ...studentForm, section: e.target.value })} />
              <input placeholder="رقم الهاتف" value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} />
              <input type="number" min="0" placeholder="القسط الكلي بالدينار" value={studentForm.fee} onChange={e => setStudentForm({ ...studentForm, fee: e.target.value })} />
            </div>
            <button className="primary">حفظ الطالب</button>
          </form>
        </div>
        <div className="panel">
          <div className="row no-print" style={{ marginBottom: 14 }}>
            <input placeholder="ابحث بالاسم أو الصف أو الشعبة أو الهاتف..." value={query} onChange={e => setQuery(e.target.value)} />
            <button className="light" onClick={exportCSV}>تصدير CSV</button>
            <button className="light" onClick={() => window.print()}>طباعة</button>
          </div>
          <StudentTable list={students} />
        </div>
      </>
    );
  }

  function Teachers() {
    return (
      <>
        <div className="panel no-print">
          <div className="panel-title">إضافة معلم</div>
          <form onSubmit={addTeacher}>
            <div className="form">
              <input placeholder="اسم المعلم *" required value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} />
              <input placeholder="المادة الدراسية" value={teacherForm.subject} onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })} />
              <input placeholder="رقم الهاتف" value={teacherForm.phone} onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
            </div>
            <button className="primary">حفظ المعلم</button>
          </form>
        </div>
        <div className="panel">
          <div className="table-wrap"><table>
            <thead><tr><th>اسم المعلم</th><th>المادة</th><th>الهاتف</th><th className="no-print">إجراء</th></tr></thead>
            <tbody>{data.teachers.map(t => <tr key={t.id}>
              <td>{t.name}</td><td>{t.subject || "—"}</td><td>{t.phone || "—"}</td>
              <td className="no-print"><button className="danger small" onClick={() => removeItem("teachers", t.id, "المعلم")}>حذف</button></td>
            </tr>)}</tbody>
          </table>{data.teachers.length === 0 && <div className="empty">لم تتم إضافة معلمين بعد.</div>}</div>
        </div>
      </>
    );
  }

  function Classes() {
    return (
      <>
        <div className="panel no-print">
          <div className="panel-title">إضافة صف أو شعبة</div>
          <form onSubmit={addClass}>
            <div className="form">
              <input placeholder="اسم الصف أو الشعبة *" required value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
              <input placeholder="المرحلة الدراسية" value={classForm.grade} onChange={e => setClassForm({ ...classForm, grade: e.target.value })} />
              <select value={classForm.teacher} onChange={e => setClassForm({ ...classForm, teacher: e.target.value })}>
                <option value="">اختر المعلم المسؤول</option>
                {data.teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <button className="primary">حفظ الصف</button>
          </form>
        </div>
        <div className="panel">
          <div className="table-wrap"><table>
            <thead><tr><th>اسم الصف/الشعبة</th><th>المرحلة</th><th>المعلم المسؤول</th><th className="no-print">إجراء</th></tr></thead>
            <tbody>{data.classes.map(c => <tr key={c.id}>
              <td>{c.name}</td><td>{c.grade || "—"}</td><td>{c.teacher || "—"}</td>
              <td className="no-print"><button className="danger small" onClick={() => removeItem("classes", c.id, "الصف")}>حذف</button></td>
            </tr>)}</tbody>
          </table>{data.classes.length === 0 && <div className="empty">لم تتم إضافة صفوف بعد.</div>}</div>
        </div>
      </>
    );
  }

  function Attendance() {
    const records = data.students.map(s => ({
      ...s,
      status: data.attendance[`${date}_${s.id}`] || "غير مسجل",
    }));
    const count = status => records.filter(s => s.status === status).length;
    return (
      <div className="panel">
        <div className="row no-print" style={{ marginBottom: 16 }}>
          <label>تاريخ الحضور</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="light" onClick={() => window.print()}>طباعة الكشف</button>
        </div>
        <div className="row" style={{ marginBottom: 15 }}>
          <span className="badge">حاضر: {count("حاضر")}</span>
          <span className="badge" style={{ background: "#fff0f0", color: "#b42318" }}>غائب: {count("غائب")}</span>
          <span className="badge" style={{ background: "#fff8e5", color: "#785b13" }}>متأخر: {count("متأخر")}</span>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>اسم الطالب</th><th>الصف</th><th>الشعبة</th><th>الحالة</th></tr></thead>
          <tbody>{records.map(s => <tr key={s.id}>
            <td>{s.name}</td><td>{s.grade || "—"}</td><td>{s.section || "—"}</td>
            <td><select value={s.status} onChange={e => markAttendance(s.id, e.target.value)}>
              <option>غير مسجل</option><option>حاضر</option><option>غائب</option><option>متأخر</option></select></td>
          </tr>)}</tbody>
        </table>{records.length === 0 && <div className="empty">أضف الطلاب أولًا لتسجيل الحضور.</div>}</div>
      </div>
    );
  }

  function Finance() {
    return (
      <>
        <div className="grid">
          <div className="card"><div className="label">إجمالي الأقساط</div><div className="metric">{money(totalFees)}</div></div>
          <div className="card"><div className="label">المبلغ المدفوع</div><div className="metric">{money(totalPaid)}</div></div>
          <div className="card"><div className="label">المتبقي</div><div className="metric">{money(totalDue)}</div></div>
          <div className="card"><div className="label">عدد الطلاب</div><div className="metric">{data.students.length}</div></div>
        </div>
        <div className="panel">
          <div className="panel-title">تسجيل دفعة طالب</div>
          <div className="table-wrap"><table>
            <thead><tr><th>الطالب</th><th>القسط الكلي</th><th>المدفوع</th><th>المتبقي</th><th className="no-print">مبلغ الدفعة</th><th className="no-print">إجراء</th></tr></thead>
            <tbody>{data.students.map(s => {
              const due = Number(s.fee) - Number(s.paid);
              return <tr key={s.id}>
                <td>{s.name}</td><td>{money(s.fee)}</td><td>{money(s.paid)}</td><td>{money(due)}</td>
                <td className="no-print"><input type="number" min="1" max={due} disabled={due <= 0} placeholder="المبلغ" value={payments[s.id] || ""} onChange={e => setPayments(old => ({ ...old, [s.id]: e.target.value }))} /></td>
                <td className="no-print">{due <= 0 ? <span className="badge">مكتمل</span> : <button className="primary small" onClick={() => recordPayment(s)}>تسجيل الدفعة</button>}</td>
              </tr>;
            })}</tbody>
          </table>{data.students.length === 0 && <div className="empty">لا توجد بيانات مالية قبل إضافة الطلاب.</div>}</div>
        </div>
      </>
    );
  }

  function Reports() {
    const present = Object.values(data.attendance).filter(v => v === "حاضر").length;
    const absent = Object.values(data.attendance).filter(v => v === "غائب").length;
    return (
      <div className="panel">
        <div className="panel-title">التقارير العامة</div>
        <div className="grid">
          <div className="card"><div className="label">الطلاب</div><div className="metric">{data.students.length}</div></div>
          <div className="card"><div className="label">المعلمون</div><div className="metric">{data.teachers.length}</div></div>
          <div className="card"><div className="label">الحالات المسجلة: حاضر</div><div className="metric">{present}</div></div>
          <div className="card"><div className="label">الحالات المسجلة: غائب</div><div className="metric">{absent}</div></div>
        </div>
        <p>إجمالي الأقساط: <b>{money(totalFees)}</b></p>
        <p>إجمالي المدفوعات المسجلة: <b>{money(totalPaid)}</b></p>
        <p>إجمالي المتبقي: <b>{money(totalDue)}</b></p>
        <p>عدد الصفوف والشعب: <b>{data.classes.length}</b></p>
        <div className="row no-print" style={{ marginTop: 18 }}>
          <button className="primary" onClick={() => window.print()}>طباعة التقرير</button>
          <button className="light" onClick={exportCSV}>تصدير بيانات الطلاب CSV</button>
        </div>
      </div>
    );
  }

  function Settings() {
    return (
      <div className="panel">
        <div className="panel-title">النسخ الاحتياطي واسترجاع البيانات</div>
        <div className="notice">احتفظ بنسخة احتياطية بانتظام. البيانات محفوظة في المتصفح وقد تُفقد إذا مسحت بيانات الموقع أو استخدمت متصفحًا آخر.</div>
        <div className="row">
          <button className="primary" onClick={backup}>تنزيل نسخة احتياطية</button>
          <label className="light" style={{ padding: 10, borderRadius: 9, cursor: "pointer" }}>
            استرجاع نسخة JSON
            <input type="file" accept=".json,application/json" onChange={restore} style={{ display: "none" }} />
          </label>
        </div>
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-title">حالة التخزين</div>
          <p>مكان الحفظ: المتصفح الحالي فقط.</p>
          <p>الطلاب: {data.students.length} | المعلمون: {data.teachers.length} | الصفوف: {data.classes.length}</p>
        </div>
      </div>
    );
  }

  const titles = {
    home: "لوحة التحكم",
    students: "إدارة الطلاب",
    teachers: "إدارة المعلمين",
    classes: "الصفوف والشعب",
    attendance: "الحضور والغياب",
    finance: "الأقساط والمدفوعات",
    reports: "التقارير والطباعة",
    settings: "النسخ الاحتياطي",
  };

  const pages = {
    home: <Home />,
    students: <Students />,
    teachers: <Teachers />,
    classes: <Classes />,
    attendance: <Attendance />,
    finance: <Finance />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return (
    <div className="app" dir="rtl">
      <style>{css}</style>
      <header className="top">
        <div>
          <div className="brand">🎓 أكاديمي | إدارة التعليم</div>
          <div className="sub">نظام إدارة المدرسة والطلاب</div>
        </div>
        <div className="row no-print">
          <span>نسخة محلية</span>
          <button className="light" onClick={backup}>نسخ احتياطي</button>
        </div>
      </header>
      <div className="layout">
        <aside className="side no-print">
          {nav.map(([id, label]) => (
            <button key={id} className={`nav ${page === id ? "active" : ""}`} onClick={() => { setPage(id); setNotice(""); }}>
              {label}
            </button>
          ))}
        </aside>
        <main className="main">
          <h1 className="heading">{titles[page]}</h1>
          <div className="muted">إدارة بيانات المؤسسة التعليمية</div>
          {notice && <div className="notice no-print">{notice}<button className="light small" style={{ float: "left" }} onClick={() => setNotice("")}>إغلاق</button></div>}
          {pages[page]}
          <div className="muted" style={{ marginTop: 24 }}>أكاديمي — نظام إدارة التعليم</div>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
