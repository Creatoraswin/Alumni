"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Student } from "@/services/apiService";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string | React.ReactNode;
  timestamp: Date;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function normalizeStr(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Profile page link */
const ProfileLink = ({ student }: { student: Student }) => (
  <a
    href={`/alumni-directory/detail?id=${encodeURIComponent(student.registrationNo)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
    </svg>
    View Full Profile
  </a>
);

/** Compact card for a single student's full details */
function StudentCard({ student, canViewContact }: { student: Student; canViewContact: boolean }) {
  return (
    <span className="block">
      👤 <strong>{student.name}</strong><br />
      🆔 Reg. No: <code className="text-xs bg-blue-50 dark:bg-blue-900 px-1 rounded">{student.registrationNo}</code><br />
      🎓 Programme: {student.programme}<br />
      🏫 School: {student.school}<br />
      📅 Graduation Year: {student.graduationYear}<br />
      💼 Status: {student.currentPosition}<br />
      🏢 Organisation: {student.organisation !== "NA" ? student.organisation : "—"}<br />
      {student.designation && student.designation !== "NA" && (
        <>🔖 Designation: {student.designation}<br /></>
      )}
      {student.linkedinId && student.linkedinId !== "NA" ? (
        <>
          <br />
          <a
            href={student.linkedinId}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-1 rounded-md bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold transition"
          >
            {/* LinkedIn logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66V19z" />
            </svg>
            View LinkedIn Profile
          </a>
          <br />
          <span className="text-[10px] text-gray-400 break-all">{student.linkedinId}</span>
        </>
      ) : (
        <span className="text-gray-400 text-xs"> Not provided</span>
      )}
      {canViewContact ? (
        <>
          <br />📞 Mobile: <strong>{student.phone !== "NA" ? student.phone : "Not provided"}</strong>
          <br />📧 Email: <strong>{student.email !== "NA" ? student.email : "Not provided"}</strong>
        </>
      ) : (
        <><br /><em className="text-xs text-muted-foreground">🔒 Contact details visible to admin only.</em></>
      )}
      <br />
      <ProfileLink student={student} />
    </span>
  );
}

/** Short row for disambiguation list */
function StudentRow({ student, index }: { student: Student; index: number }) {
  return (
    <span className="flex items-center gap-1 text-xs py-0.5">
      <strong>{index + 1}.</strong>
      <span className="flex-1">
        {student.name}
        <span className="text-muted-foreground"> — {student.programme.split("(")[0].trim()}, {student.school.split("School of ")[1]?.split(",")[0] || student.school}, {student.graduationYear}</span>
        <span className="font-mono ml-1 text-blue-600"> [{student.registrationNo}]</span>
      </span>
      <a
        href={`/alumni-directory/detail?id=${encodeURIComponent(student.registrationNo)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[10px] font-semibold text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-1.5 py-0.5 hover:bg-blue-50 transition"
      >
        view
      </a>
    </span>
  );
}

// ─── Query Engine ──────────────────────────────────────────────────────────────
function buildReply(query: string, students: Student[], canViewContact: boolean): React.ReactNode {
  const q = normalizeStr(query);

  const approved = students.filter(
    (s) => (s.status || s.Status || "").toLowerCase() === "approved"
  );

  const formatList = (items: string[], limit = 10) => {
    const unique = Array.from(new Set(items.filter(Boolean)));
    if (!unique.length) return "No data found.";
    const shown = unique.slice(0, limit);
    const rest = unique.length - shown.length;
    return shown.join(", ") + (rest > 0 ? ` …and ${rest} more.` : ".");
  };

  // ── Count queries ────────────────────────────────────────────────────────────
  if (/\b(how many|count|total|number of)\b.*\balumni\b/.test(q)) {
    return `There are ${approved.length} registered alumni in the CUTMAP Alumni Network.`;
  }
  if (/\b(how many|count|total|number of)\b.*\b(school|schools)\b/.test(q)) {
    const schools = Array.from(new Set(approved.map((s) => s.school).filter(Boolean)));
    return `There are ${schools.length} schools among alumni: ${schools.join(", ")}.`;
  }
  if (/\b(how many|count|total|number of)\b.*\b(department|programme|program)\b/.test(q)) {
    const depts = Array.from(new Set(approved.map((s) => s.programme).filter(Boolean)));
    return `There are ${depts.length} programmes/departments represented among alumni.`;
  }
  if (/\b(how many|count|total|number of)\b.*\b(compan|companies|organisations|organizations)\b/.test(q)) {
    const companies = Array.from(new Set(approved.map((s) => s.organisation).filter((v) => v && v !== "NA")));
    return `Alumni work in ${companies.length} unique companies/organisations.`;
  }

  // ── List queries ─────────────────────────────────────────────────────────────
  if (/\b(list|show|what are|companies|company|compan|organisations|organizations)\b/.test(q)) {
    // Match anything about companies / organisations
    if (/\b(compan|companies|organisation|organizations)\b/.test(q)) {
      // Case-preserving unique list
      const companySet = new Map<string, string>();
      approved.forEach((s) => {
        const v = s.organisation;
        if (v && v !== "NA") {
          companySet.set(v.toLowerCase(), v); // dedupe case-insensitively, keep original casing
        }
      });
      const companies = Array.from(companySet.values()).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      return (
        <span>
          <strong>{companies.length}</strong> companies / organisations alumni work in:<br />
          <span className="text-xs leading-5">{companies.join(" · ")}</span>
        </span>
      );
    }
  }

  if (/\b(list|show|what are)\b.*\b(school|schools)\b/.test(q)) {
    const schools = Array.from(new Set(approved.map((s) => s.school).filter(Boolean)));
    return <span>Schools with alumni: <strong>{schools.join(", ")}</strong>.</span>;
  }
  if (/\b(list|show|what are)\b.*\b(department|programme|program)\b/.test(q)) {
    const progs = Array.from(new Set(approved.map((s) => s.programme).filter((v) => v && v !== "NA")));
    return <span>Programmes represented: {formatList(progs, 20)}</span>;
  }
  if (/\b(list|show|what are)\b.*\b(position|designation|job role)\b/.test(q)) {
    const positions = Array.from(new Set(approved.map((s) => s.designation).filter((v) => v && v !== "NA")));
    return <span>Designation roles: {formatList(positions, 15)}</span>;
  }

  // ── Find by Registration Number ───────────────────────────────────────────────
  const regMatch = q.match(/\b(\d{12})\b/);
  if (regMatch) {
    const regNo = regMatch[1];
    const student = approved.find((s) => s.registrationNo === regNo);
    if (!student) return `No alumni found with registration number ${regNo}.`;
    return <StudentCard student={student} canViewContact={canViewContact} />;
  }

  // ── Bot Identity ─────────────────────────────────────────────────────────────
  if (/\b(who are you|what are you|your name|introduce yourself|tell me about you|are you a bot|are you ai|what is this|what do you do)\b/.test(q)) {
    return (
      <span>
        🤖 Hi! I am the <strong>CUTMAP Alumni Chat Assistant</strong>.<br />
        I help you explore the alumni network of <strong>Centurion University of Technology and Management (CUTMAP)</strong>.<br /><br />
        🔍 <strong>Search alumni by:</strong><br />
        &nbsp;&nbsp;• Name — e.g. type <em>"Raju"</em><br />
        &nbsp;&nbsp;• Registration number — e.g. <em>"211801370014"</em><br /><br />
        📊 <strong>You can also ask me about:</strong><br />
        &nbsp;&nbsp;• Alumni counts, schools, companies<br />
        &nbsp;&nbsp;• College info &amp; admissions<br />
        &nbsp;&nbsp;• Contact alumni manager<br /><br />
        Type <strong>"help"</strong> to see all commands!
      </span>
    );
  }

  // ── About the College ─────────────────────────────────────────────────────────
  if (/\b(about (the )?college|about (the )?university|about cutmap|about centurion|what is cutmap|what is centurion)\b/.test(q)) {
    return (
      <span>
        🏛️ <strong>About Centurion University (CUTMAP)</strong><br />
        Centurion University of Technology and Management (CUTMAP) is a leading private university in Andhra Pradesh, India.<br /><br />
        🎓 Offers UG, PG &amp; PhD programmes in Engineering, Management, Allied Health Sciences &amp; more.<br />
        🌐 <a href="https://cutmap.ac.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">cutmap.ac.in</a><br />
        📍 Location: Paralakhemundi, Odisha / Vizianagaram, Andhra Pradesh<br />
        📞 Contact: <a href="tel:+916742529800" className="text-blue-500 underline">+91-674-2529800</a>
      </span>
    );
  }

  // ── Admissions ────────────────────────────────────────────────────────────────
  if (/\b(admission|admissions|apply|enroll|enrollment|join|how to join|get admission)\b/.test(q)) {
    return (
      <span>
        📋 <strong>Admissions at CUTMAP</strong><br />
        Centurion University accepts applications for various UG and PG programmes.<br /><br />
        ✅ Eligibility varies by programme (10+2 / graduation / entrance exams)<br />
        📅 Applications are typically open April–July each year<br />
        🌐 Apply online: <a href="https://cutmap.ac.in/admissions" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">cutmap.ac.in/admissions</a><br />
        📞 Helpline: <a href="tel:+916742529800" className="text-blue-500 underline">+91-674-2529800</a><br /><br />
        💡 <em>For alumni-specific queries, I can also help!</em>
      </span>
    );
  }

  // ── Courses / Programmes ──────────────────────────────────────────────────────
  if (/\b(course|courses|programme|programs|what (do you|does the college) offer|degree|btech|mtech|mba|bca|bsc|msc|phd)\b/.test(q)) {
    return (
      <span>
        📚 <strong>Programmes offered at CUTMAP</strong><br />
        🔧 <strong>Engineering:</strong> B.Tech / M.Tech (CSE, ECE, Mechanical, Civil…)<br />
        💼 <strong>Management:</strong> BBA, MBA<br />
        🏥 <strong>Allied Health Sciences:</strong> Radiology, Optometry, Anaesthesia, Forensic<br />
        💻 <strong>Computing:</strong> BCA, MCA, B.Sc CS<br />
        🔬 <strong>Research:</strong> PhD programmes across disciplines<br /><br />
        🌐 Full list: <a href="https://cutmap.ac.in/academics" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">cutmap.ac.in/academics</a>
      </span>
    );
  }

  // ── Location / Campus ─────────────────────────────────────────────────────────
  if (/\b(location|campus|address|where is|situated|vizianagaram|paralakhemundi|odisha|andhra)\b/.test(q)) {
    return (
      <span>
        📍 <strong>CUTMAP Campus Locations</strong><br />
        🏫 <strong>Main Campus:</strong> Paralakhemundi, Odisha<br />
        🏫 <strong>AP Campus:</strong> Vizianagaram, Andhra Pradesh<br /><br />
        🌐 <a href="https://cutmap.ac.in/campus" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View on website</a>
      </span>
    );
  }

  // ── Find by Name ─────────────────────────────────────────────────────────────
  // Broad name search: any text that looks like a person's name (not a keyword)
  const keywordPrefixMatch = q.match(/^(?:find|search|who is|about|info(?:rmation)? (?:about|of|on))\s+(.+)/);
  // Also try plain name (e.g. "raju" typed directly)
  const nameToSearch = keywordPrefixMatch
    ? normalizeStr(keywordPrefixMatch[1])
    : (() => {
        // If query is short (≤3 words) and has no other keyword triggers, treat as name search
        const words = q.trim().split(" ");
        const hasKeyword = /\b(how many|list|show|stat|count|total|batch|alumni|school|company|compan|department|contact|manager|help|hello|hi|hey|who are you|what are you|about|college|university|admission|course|location|campus|cutmap|centurion)\b/.test(q);
        return (!hasKeyword && words.length <= 3) ? q.trim() : null;
      })();

  if (nameToSearch) {
    const found = approved.filter((s) => normalizeStr(s.name).includes(nameToSearch));
    if (found.length === 0) {
      return (
        <span>
          No alumni found matching "<strong>{nameToSearch}</strong>".<br />
          Try a different name or provide the 12-digit registration number.
        </span>
      );
    }
    // Exactly 1 match → show full details
    if (found.length === 1) {
      return <StudentCard student={found[0]} canViewContact={canViewContact} />;
    }
    // 2–8 matches → compact disambiguation list
    if (found.length <= 8) {
      return (
        <span>
          Found <strong>{found.length}</strong> alumni matching "<strong>{nameToSearch}</strong>":<br />
          {found.map((s, i) => <StudentRow key={s.id} student={s} index={i} />)}
          <br />
          <em className="text-xs">Reply with the <strong>12-digit reg. number</strong> to see full details.</em>
        </span>
      );
    }
    // Many matches → show top 8 + prompt for refinement
    return (
      <span>
        Found <strong>{found.length}</strong> alumni matching "<strong>{nameToSearch}</strong>". Showing top 8:<br />
        {found.slice(0, 8).map((s, i) => <StudentRow key={s.id} student={s} index={i} />)}
        <br />
        <em className="text-xs">Please be more specific or paste the <strong>12-digit reg. number</strong>.</em>
      </span>
    );
  }

  // ── Company alumni list ───────────────────────────────────────────────────────
  const companyMatch = q.match(/alumni.*\b(in|at|from|working at)\b\s+(.+)/);
  if (companyMatch) {
    const companySearch = normalizeStr(companyMatch[2].replace(/[?!.,]/g, ""));
    const found = approved.filter((s) => normalizeStr(s.organisation).includes(companySearch));
    if (found.length > 0) {
      return (
        <span>
          <strong>{found.length}</strong> alumni work at "{found[0].organisation}":<br />
          {found.slice(0, 8).map((s) => (
            <span key={s.id} className="block text-xs">• {s.name} ({s.programme}, {s.graduationYear})
              &nbsp;<a href={`/alumni-directory/detail?id=${s.registrationNo}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">profile</a>
            </span>
          ))}
          {found.length > 8 && <em className="text-xs">…and {found.length - 8} more.</em>}
        </span>
      );
    }
  }

  // ── Graduation year queries ───────────────────────────────────────────────────
  const yearMatch = q.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch && /\b(alumni|batch|graduate|passed out)\b/.test(q)) {
    const year = yearMatch[1];
    const found = approved.filter((s) => s.graduationYear === year);
    return found.length > 0
      ? `${found.length} alumni graduated in ${year}.`
      : `No alumni found for the ${year} batch.`;
  }

  // ── Statistics ────────────────────────────────────────────────────────────────
  if (/\b(stat|statistics|overview|summary|dashboard)\b/.test(q)) {
    const schools = Array.from(new Set(approved.map((s) => s.school).filter(Boolean)));
    const progs = Array.from(new Set(approved.map((s) => s.programme).filter(Boolean)));
    const companies = Array.from(new Set(approved.map((s) => s.organisation).filter((v) => v && v !== "NA")));
    const jobs = approved.filter((s) => s.currentPosition === "Job");
    const higher = approved.filter((s) => s.currentPosition === "Higher study");
    const entrepreneurs = approved.filter((s) => s.currentPosition === "Entrepreneurship");
    return (
      <span>
        📊 <strong>CUTMAP Alumni Network — Quick Stats</strong><br />
        👥 Total Alumni: <strong>{approved.length}</strong><br />
        🏫 Schools: <strong>{schools.length}</strong><br />
        📚 Programmes: <strong>{progs.length}</strong><br />
        🏢 Companies: <strong>{companies.length}+</strong><br />
        💼 In Jobs: <strong>{jobs.length}</strong><br />
        🎓 Higher Studies: <strong>{higher.length}</strong><br />
        🚀 Entrepreneurs: <strong>{entrepreneurs.length}</strong>
      </span>
    );
  }

  // ── Contact Alumni Manager ────────────────────────────────────────────────────
  if (/\b(contact|reach|alumni manager|manager)\b/.test(q)) {
    return (
      <span>
        📞 <strong>Contact Alumni Manager</strong><br />
        For registration issues or data corrections:<br />
        🏢 CUTMAP Alumni Cell<br />
        📧 <a href="mailto:alumni@cutmap.ac.in" className="text-blue-500 underline">alumni@cutmap.ac.in</a><br />
        🌐 <a href="/" className="text-blue-500 underline">cutmap.ac.in</a>
      </span>
    );
  }

  // ── Phone / Email without login ───────────────────────────────────────────────
  if (!canViewContact && /\b(phone|mobile|email|number|mail)\b/.test(q)) {
    return (
      <span>
        🔒 Phone &amp; email are only visible to <strong>admin users</strong>.<br />
        Alumni accounts do not have access to contact details.
      </span>
    );
  }

  // ── Greetings ─────────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|good morning|good afternoon|howdy|yo)\b/.test(q)) {
    return (
      <span>
        👋 Hello! I'm the <strong>CUTMAP Alumni Assistant</strong>.<br />
        I can help with:<br />
        • Alumni by name or registration number<br />
        • Department &amp; school counts<br />
        • Company &amp; batch statistics<br />
        {!canViewContact && <><br />💡 <em>Login as admin to view phone &amp; email.</em></>}
      </span>
    );
  }

  if (/\b(help|what can you do|commands)\b/.test(q)) {
    return (
      <span>
        🤖 <strong>Things I can answer:</strong><br />
        • "Find Raju" or just type a name<br />
        • "123456789012" (12-digit reg. no.)<br />
        • "How many alumni?"<br />
        • "How many schools?"<br />
        • "List companies"<br />
        • "Alumni from 2020 batch"<br />
        • "Statistics"<br />
        • "Contact alumni manager"<br />
        {!canViewContact && <><br />🔒 <em>Admin login required for phone &amp; email.</em></>}
      </span>
    );
  }

  // ── Fallback ──────────────────────────────────────────────────────────────────
  return (
    <span>
      🤔 I'm not sure about that. Here's what I can help with:<br />
      🔍 <strong>Search alumni:</strong> type a name or 12-digit reg. no.<br />
      📊 Alumni stats: "How many alumni?", "List companies"<br />
      🏛️ College info: "About CUTMAP", "Admissions", "Courses"<br />
      📞 "Contact alumni manager"<br />
      Type <strong>"help"</strong> for the full list.
    </span>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AlumniChatbot() {
  const { students, isLoggedIn, userRole } = useAuth();
  // Only admin-level roles can see phone & email
  const canViewContact = [
    "admin", "cadmin", "alumni-manager", "school", "department"
  ].includes(userRole ?? "");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: (
        <span>
          👋 Hi! I'm the <strong>CUTMAP Alumni Assistant</strong>.<br />
          Ask me about alumni by name, reg. number, school, company, or batch!<br />
          Type <strong>help</strong> to see all options.
        </span>
      ),
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart partial-word suggestions
  const SUGGESTION_MAP: { pattern: RegExp; suggestion: string }[] = [
    { pattern: /^compan/i, suggestion: "List companies" },
    { pattern: /^organ/i, suggestion: "List companies" },
    { pattern: /^school/i, suggestion: "List schools" },
    { pattern: /^how many/i, suggestion: "How many alumni?" },
    { pattern: /^stat/i, suggestion: "Statistics" },
    { pattern: /^help/i, suggestion: "Help" },
    { pattern: /^dept|^depart/i, suggestion: "List departments" },
    { pattern: /^prog/i, suggestion: "List programmes" },
    { pattern: /^contact/i, suggestion: "Contact alumni manager" },
    { pattern: /^batch|^grad/i, suggestion: "Alumni from 2023 batch" },
  ];

  const updateSuggestions = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 3) { setSuggestions([]); return; }
    const matched = SUGGESTION_MAP
      .filter((m) => m.pattern.test(trimmed))
      .map((m) => m.suggestion)
      .filter((s, i, arr) => arr.indexOf(s) === i); // dedupe
    setSuggestions(matched.slice(0, 3));
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { id: Date.now() + "-u", role: "user", text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setTimeout(() => {
        const reply = buildReply(text, students, canViewContact);
        const botMsg: Message = { id: Date.now() + "-b", role: "bot", text: reply, timestamp: new Date() };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
    },
    [students, canViewContact]
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }, [input, sendMessage]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") send();
    if (e.key === "Escape") setSuggestions([]);
  };

  const QUICK_PROMPTS = ["How many alumni?", "List schools", "List companies", "Help"];

  return (
    <>
      {/* Toggle button */}
      <button
        id="alumni-chatbot-toggle"
        aria-label="Open Alumni Chat Assistant"
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
        }`}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {/* Chat panel — solid white/dark background, high z-index */}
      {open && (
        <div
          id="alumni-chatbot-panel"
          className="fixed bottom-24 right-4 z-[9998] w-[calc(100vw-2rem)] sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          style={{
            backgroundColor: "white",
            maxHeight: "80vh",
          }}
        >
          {/* Inner wrapper keeps bg solid in dark mode too */}
          <style>{`
            @media (prefers-color-scheme: dark) {
              #alumni-chatbot-panel { background-color: #1e1e2e !important; }
            }
            .dark #alumni-chatbot-panel { background-color: #1e1e2e !important; }
          `}</style>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">CUTMAP Alumni Assistant</p>
              <p className="text-blue-200 text-xs truncate">
                {canViewContact
                  ? "✅ Admin — contact details visible"
                  : isLoggedIn
                    ? "🎓 Alumni login — contact details hidden"
                    : "ℹ️ Login for contact details"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition shrink-0" aria-label="Close chatbot">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages — flex-1 scrollable */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <style>{`.dark #alumni-chatbot-panel .chat-messages { background-color: #13131f !important; }`}</style>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm border border-gray-200 shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2 flex gap-1 items-center shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pt-2 pb-2 border-t border-gray-100 flex gap-2 items-center shrink-0" style={{ backgroundColor: "white" }}>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                id="chatbot-input"
                value={input}
                onChange={(e) => { setInput(e.target.value); updateSuggestions(e.target.value); }}
                onKeyDown={handleKey}
                placeholder="Type a name, reg. no., or question…"
                className="w-full text-sm rounded-full border border-gray-200 px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
              />
              {/* Smart suggestion dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  <p className="text-[10px] text-gray-400 px-3 pt-2 pb-0.5">Did you mean?</p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setInput(""); setSuggestions([]); sendMessage(s); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              id="chatbot-send-btn"
              onClick={send}
              disabled={!input.trim()}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 rotate-90">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>

          {/* Quick prompts — always pinned at very bottom */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 border-t border-gray-100" style={{ backgroundColor: "white" }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Branding footer */}
          <div className="px-4 py-1.5 flex items-center justify-center gap-1 border-t border-gray-100 shrink-0" style={{ backgroundColor: "white" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-500">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-gray-400">
              Designed by{" "}
              <a
                href="https://sparvixainnovations.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-500 hover:text-indigo-700 transition"
              >
                Sparvix Innovation
              </a>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
