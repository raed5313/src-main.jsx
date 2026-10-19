
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardCheck, Wallet, BarChart3, Settings,
  Search, Plus, Trash2, Download, Menu, X,
  School, CalendarDays, CheckCircle2, AlertCircle
} from "lucide-react";

import "./style.css";

const initialStudents = [
  { id: 1, name: "أحمد محمد", className: "الأول أ", phone: "", fee: 500000, paid: 300000 },
  { id: 2, name: "زينب علي", className: "الثاني أ", phone: "", fee: 500000, paid: 500000 },
  { id: 3, name: "حسين كريم", className: "الأول ب", phone: "", fee: 450000, paid: 150000 }
];

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [students, setStudents] = useState(() =>
    loadData("academi_students", initialStudents)
  );
  const [teachers, setTeachers] = useState(() =>
    loadData("academi_teachers", [])
  );
  const [classes, setClasses] = useState(() =>
    loadData("academi_classes", ["الأول أ", "الأول ب", "الثاني أ"])
  );
  const [attendance, setAttendance] = useState(() =>
    loadData("academi_attendance", [])
  );
  const [payments, setPayments] = useState(() =>
    loadData("academi_payments", [])
  );
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", className: "الأول أ", phone: "",
    fee: "500000", paid: "0"
  });
  const [teacherName, setTeacherName] = useState("");
  const [className, setClassName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    localStorage.setItem("academi_students", JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem("academi_teachers", JSON.stringify(teachers));
  }, [teachers]);
  useEffect(() => {
    localStorage.setItem("academi_classes", JSON.stringify(classes));
  }, [classes]);
  useEffect(() => {
    localStorage.setItem("academi_attendance", JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem("academi_payments", JSON.stringify(payments));
  }, [payments]);

  const totalFees = students.reduce((sum, s) => sum + Number(s.fee || 0), 0);
  const totalPaid = students.reduce((sum, s) => sum + Number(s.paid || 0), 0);
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  }, [students, search]);

  const nav = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "teachers", label: "المعلمون", icon: GraduationCap },
    { id: "classes", label: "الصفوف الدراسية", icon: BookOpen },
    { id: "attendance", label: "الحضور والغياب", icon: ClipboardCheck },
    { id: "finance", label: "الرسوم والمدفوعات", icon: Wallet },
    { id: "reports", label: "التقارير", icon: BarChart3 },
    { id: "settings", label: "الإعدادات", icon: Settings }
  ];

  function notify(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  }

  function addStudent(e) {
    e.preventDefault();
    const fee = Number(form.fee);
    const paid = Number(form.paid);
    if (!form.name.trim()) return notify("يرجى إدخال اسم الطالب");
    if (fee < 0 || paid < 0 || paid > fee)
      return notify("تحقق من مبالغ الرسوم والمدفوعات");
    setStudents(prev => [...prev, {
      id: Date.now(),
      name: form.name.trim(),
      className: form.className,
      phone: form.phone.trim(),
      fee,
      paid
    }]);
    setForm({ name: "", className: classes[0] || "", phone: "", fee: "500000", paid: "0" });
    setShowForm(false);
    notify("تمت إضافة الطالب بنجاح");
  }

  function markAttendance(studentId, status) {
    setAttendance(prev => {
      const rest = prev.filter(a =>
        !(a.studentId === studentId && a.date === selectedDate)
      );
      return [...rest, { studentId, date: selectedDate, status }];
    });
    notify("تم حفظ الحضور");
  }

  function addPayment(studentId, amount) {
    const value = Number(amount);
    const student = students.find(s => s.id === studentId);
    if (!student || !Number.isFinite(value) || value <= 0)
      return notify("أدخل مبلغًا صحيحًا");
    if (value > student.fee - student.paid)
      return notify("المبلغ أكبر من الرسوم المتبقية");

    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, paid: s.paid + value } : s
    ));
    setPayments(prev => [...prev, {
      id: Date.now(), studentId, amount: value,
      date: new Date().toISOString().slice(0, 10)
    }]);
    notify("تم تسجيل الدفعة");
  }

  function exportCSV() {
    const rows = [
      ["الاسم", "الصف", "الهاتف", "الرسوم", "المدفوع", "المتبقي"],
      ...students.map(s => [
        s.name, s.className, s.phone, s.fee, s.paid, s.fee - s.paid
      ])
    ];
    const csv = "\uFEFF" + rows.map(row =>
      row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const url = URL.createObjectURL(new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "akademi-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const money = n => Number(n || 0).toLocaleString("en-US") + " د.ع";
  const attendanceFor = id =>
    attendance.find(a => a.studentId === id && a.date === selectedDate);

  function PageTitle({ title, subtitle }) {
    return <div className="page-title">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
    </div>;
  }

  function Dashboard() {
    return <>
      <PageTitle title="لوحة التحكم" subtitle="نظرة عامة على بيانات المدرسة" />
      <div className="welcome">
        <div><span>مرحبًا بك في</span><h2>أكاديمي لإدارة التعليم</h2>
          <p>إدارة مدرستك من مكان واحد وبكل سهولة.</p></div>
        <School size={58} />
      </div>
      <div className="stats">
        <Stat icon={Users} label="إجمالي الطلاب" value={students.length} />
        <Stat icon={GraduationCap} label="المعلمون" value={teachers.length} />
        <Stat icon={BookOpen} label="الصفوف" value={classes.length} />
        <Stat icon={Wallet} label="المبالغ المستلمة" value={money(totalPaid)} />
      </div>
      <div className="panel">
        <div className="panel-heading"><h3>آخر الطلاب المسجلين</h3>
          <button className="light-btn" onClick={() => setPage("students")}>عرض الكل</button>
        </div>
        <StudentTable rows={students.slice(-5).reverse()} />
      </div>
      <div className="panel">
        <h3>ملخص الرسوم الدراسية</h3>
        <div className="finance-summary">
          <div><span>إجمالي الرسوم</span><strong>{money(totalFees)}</strong></div>
          <div><span>المبلغ المستلم</span><strong className="green">{money(totalPaid)}</strong></div>
          <div><span>المبلغ المتبقي</span><strong className="red">{money(totalFees-totalPaid)}</strong></div>
        </div>
      </div>
    </>;
  }

  function Stat({ icon: Icon, label, value }) {
    return <div className="stat"><div className="stat-icon"><Icon size={23}/></div>
      <div><span>{label}</span><strong>{value}</strong></div></div>;
  }

  function StudentTable({ rows }) {
    if (!rows.length) return <div className="empty">لا توجد بيانات لعرضها</div>;
    return <div className="table-wrap"><table><thead><tr>
      <th>اسم الطالب</th><th>الصف</th><th>الهاتف</th><th>الرسوم</th><th>المتبقي</th>
      <th>الإجراء</th></tr></thead><tbody>
      {rows.map(s => <tr key={s.id}>
        <td><strong>{s.name}</strong></td><td>{s.className}</td>
        <td>{s.phone || "—"}</td><td>{money(s.fee)}</td>
        <td className={s.fee-s.paid > 0 ? "red" : "green"}>{money(s.fee-s.paid)}</td>
        <td><button className="icon-btn danger" title="حذف الطالب"
          onClick={() => {
            if (confirm("هل تريد حذف الطالب " + s.name + "؟"))
              setStudents(prev => prev.filter(x => x.id !== s.id));
          }}><Trash2 size={16}/></button></td>
      </tr>)}
      </tbody></table></div>;
  }

  function Students() {
    return <>
      <PageTitle title="إدارة الطلاب" subtitle={`عدد الطلاب المسجلين: ${students.length}`} />
      <div className="toolbar">
        <div className="search"><Search size={18}/><input value={search}
          onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الطالب أو الصف..." /></div>
        <button className="primary" onClick={() => setShowForm(v => !v)}><Plus size={18}/> إضافة طالب</button>
        <button className="light-btn" onClick={exportCSV}><Download size={17}/> تصدير CSV</button>
      </div>
      {showForm && <form className="panel form-grid" onSubmit={addStudent}>
        <h3 className="full">بيانات الطالب الجديد</h3>
        <label>اسم الطالب<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label>
        <label>الصف الدراسي<select value={form.className} onChange={e => setForm({...form,className:e.target.value})}>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select></label>
        <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></label>
        <label>الرسوم السنوية بالدينار<input type="number" min="0" required value={form.fee} onChange={e => setForm({...form,fee:e.target.value})}/></label>
        <label>المبلغ المدفوع<input type="number" min="0" required value={form.paid} onChange={e => setForm({...form,paid:e.target.value})}/></label>
        <button className="primary full" type="submit">حفظ الطالب</button>
      </form>}
      <div className="panel"><StudentTable rows={filteredStudents}/></div>
    </>;
  }

  function Teachers() {
    return <>
      <PageTitle title="إدارة المعلمين" subtitle="إضافة أسماء الكادر التعليمي" />
      <form className="panel inline-form" onSubmit={e => {
        e.preventDefault();
        if (!teacherName.trim()) return;
        setTeachers(p => [...p, {id:Date.now(),name:teacherName.trim()}]);
        setTeacherName(""); notify("تمت إضافة المعلم");
      }}>
        <input required placeholder="اسم المعلم أو المعلمة" value={teacherName} onChange={e=>setTeacherName(e.target.value)}/>
        <button className="primary"><Plus size={17}/> إضافة معلم</button>
      </form>
      <div className="panel"><div className="simple-list">{teachers.map(t =>
        <div className="list-row" key={t.id}><span><GraduationCap size={18}/> {t.name}</span>
          <button className="icon-btn danger" onClick={()=>setTeachers(p=>p.filter(x=>x.id!==t.id))}><Trash2 size={16}/></button></div>)}
        {!teachers.length && <div className="empty">لم تتم إضافة معلمين بعد</div>}</div></div>
    </>;
  }

  function Classes() {
    return <>
      <PageTitle title="الصفوف الدراسية" subtitle="إدارة الصفوف والشعب" />
      <form className="panel inline-form" onSubmit={e => {
        e.preventDefault();
        const name = className.trim();
        if (!name) return;
        if (classes.includes(name)) return notify("هذا الصف موجود مسبقًا");
        setClasses(p => [...p, name]); setClassName(""); notify("تمت إضافة الصف");
      }}>
        <input required placeholder="اسم الصف، مثل الثالث أ" value={className} onChange={e=>setClassName(e.target.value)}/>
        <button className="primary"><Plus size={17}/> إضافة صف</button>
      </form>
      <div className="stats">{classes.map(c => <div className="stat" key={c}>
        <div className="stat-icon"><BookOpen size={22}/></div>
        <div><strong>{c}</strong><span>{students.filter(s=>s.className===c).length} طالب</span></div>
        <button className="icon-btn danger" onClick={() => {
          if (students.some(s=>s.className===c)) return notify("لا يمكن حذف صف يحتوي على طلاب");
          setClasses(p=>p.filter(x=>x!==c));
        }}><Trash2 size={16}/></button>
      </div>)}</div>
    </>;
  }

  function Attendance() {
    return <>
      <PageTitle title="الحضور والغياب" subtitle="تسجيل حضور الطلاب يوميًا" />
      <div className="panel"><label className="date-field">تاريخ السجل
        <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
      </label>
      <div className="table-wrap"><table><thead><tr><th>اسم الطالب</th><th>الصف</th><th>الحالة</th></tr></thead>
      <tbody>{students.map(s => {
        const a = attendanceFor(s.id);
        return <tr key={s.id}><td>{s.name}</td><td>{s.className}</td><td>
          <div className="attendance-actions">
            <button className={a?.status==="present"?"status present selected":"status present"} onClick={()=>markAttendance(s.id,"present")}>حاضر</button>
            <button className={a?.status==="absent"?"status absent selected":"status absent"} onClick={()=>markAttendance(s.id,"absent")}>غائب</button>
            <button className={a?.status==="late"?"status late selected":"status late"} onClick={()=>markAttendance(s.id,"late")}>متأخر</button>
          </div></td></tr>;
      })}</tbody></table></div>
      <p className="muted">سجل هذا التاريخ: {attendance.filter(a=>a.date===selectedDate).length} من {students.length} طالبًا.</p>
      </div>
    </>;
  }

  function Finance() {
    const [amounts, setAmounts] = useState({});
    return <>
      <PageTitle title="الرسوم والمدفوعات" subtitle="متابعة الرسوم والمبالغ المستلمة" />
      <div className="stats">
        <Stat icon={Wallet} label="إجمالي الرسوم" value={money(totalFees)}/>
        <Stat icon={CheckCircle2} label="المستلم" value={money(totalPaid)}/>
        <Stat icon={AlertCircle} label="المتبقي" value={money(totalFees-totalPaid)}/>
      </div>
      <div className="panel"><div className="table-wrap"><table><thead><tr>
        <th>الطالب</th><th>الرسوم</th><th>المدفوع</th><th>المتبقي</th><th>تسجيل دفعة</th>
      </tr></thead><tbody>{students.map(s=><tr key={s.id}>
        <td>{s.name}</td><td>{money(s.fee)}</td><td className="green">{money(s.paid)}</td>
        <td className="red">{money(s.fee-s.paid)}</td><td>
          {s.fee>s.paid && <div className="payment-input">
            <input type="number" min="1" max={s.fee-s.paid} placeholder="المبلغ"
              value={amounts[s.id]||""} onChange={e=>setAmounts(p=>({...p,[s.id]:e.target.value}))}/>
            <button className="primary small" onClick={()=>{
              addPayment(s.id,amounts[s.id]);
              setAmounts(p=>({...p,[s.id]:""}));
            }}>تسجيل</button>
          }{s.fee<=s.paid && <span className="green">مكتمل</span>}</div>
        }</td></tr>)}</tbody></table></div></div>
      <div className="panel"><h3>آخر الدفعات</h3>
        {!payments.length && <div className="empty">لا توجد دفعات مسجلة</div>}
        {payments.slice().reverse().map(p=><div className="list-row" key={p.id}>
          <span>{students.find(s=>s.id===p.studentId)?.name || "طالب محذوف"} — {p.date}</span>
          <strong className="green">{money(p.amount)}</strong>
        </div>)}
      </div>
    </>;
  }

  function Reports() {
    const present = attendance.filter(a=>a.date===selectedDate&&a.status==="present").length;
    const absent = attendance.filter(a=>a.date===selectedDate&&a.status==="absent").length;
    const late = attendance.filter(a=>a.date===selectedDate&&a.status==="late").length;
    return <>
      <PageTitle title="التقارير" subtitle="ملخص بيانات الطلاب والحضور والرسوم" />
      <div className="stats">
        <Stat icon={Users} label="الطلاب" value={students.length}/>
        <Stat icon={CheckCircle2} label="الحاضرون اليوم المحدد" value={present}/>
        <Stat icon={AlertCircle} label="الغائبون" value={absent}/>
        <Stat icon={CalendarDays} label="المتأخرون" value={late}/>
      </div>
      <div className="panel"><h3>تقرير الحضور</h3><p>التاريخ: {selectedDate}</p>
        <p>حاضر: {present} — غائب: {absent} — متأخر: {late}</p>
        <button className="primary" onClick={exportCSV}><Download size={17}/> تصدير تقرير الطلاب والرسوم</button>
      </div>
    </>;
  }

  function SettingsPage() {
    return <>
      <PageTitle title="الإعدادات" subtitle="معلومات النظام والتخزين" />
      <div className="panel"><h3>أكاديمي لإدارة التعليم</h3>
        <p>الإصدار التجريبي 1.0</p>
        <p>تُحفظ البيانات على هذا المتصفح والجهاز باستخدام localStorage.</p>
        <p className="red">هذه النسخة لا توفر تسجيل دخول أو قاعدة بيانات مشتركة أو نسخًا احتياطيًا تلقائيًا.</p>
        <button className="light-btn" onClick={exportCSV}><Download size={17}/> تنزيل نسخة من بيانات الطلاب</button>
      </div>
    </>;
  }

  const pages = {
    dashboard: <Dashboard/>,
    students: <Students/>,
    teachers: <Teachers/>,
    classes: <Classes/>,
    attendance: <Attendance/>,
    finance: <Finance/>,
    reports: <Reports/>,
    settings: <SettingsPage/>
  };

  return <div className="app-shell">
    {mobileMenu && <div className="mobile-backdrop" onClick={()=>setMobileMenu(false)}/>}
    <aside className={mobileMenu?"sidebar open":"sidebar"}>
      <div className="brand"><div className="brand-logo"><School size={26}/></div>
        <div><strong>أكاديمي</strong><span>نظام إدارة التعليم</span></div>
        <button className="close-menu" onClick={()=>setMobileMenu(false)}><X/></button>
      </div>
      <div className="nav-caption">القائمة الرئيسية</div>
      <nav>{nav.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={page===item.id?"nav-item active":"nav-item"}
          onClick={()=>{setPage(item.id);setMobileMenu(false);}}>
          <Icon size={19}/><span>{item.label}</span>
        </button>;
      })}</nav>
      <div className="sidebar-footer"><div className="avatar">أ</div>
        <div><strong>مدير المدرسة</strong><span>الحساب المحلي</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="menu-button" onClick={()=>setMobileMenu(true)}><Menu/></button>
        <div><span className="breadcrumb">أكاديمي / </span><strong>{nav.find(n=>n.id===page)?.label}</strong></div>
        <div className="top-date"><CalendarDays size={17}/> {new Date().toLocaleDateString("ar-IQ")}</div>
      </header>
      <section className="content">{pages[page]}</section>
      <footer className="footer">أكاديمي لإدارة التعليم © {new Date().getFullYear()}</footer>
    </main>
    {notice && <div className="toast">{notice}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
