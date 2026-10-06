"use client";
import { useState } from "react";
import { Check, KeyRound, Pin, PinOff, Send, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { ActionForm } from "@/components/action-form";
import { FileUpload } from "@/components/file-upload";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AL_YEARS, CLASS_TYPES, NOTICE_TAGS, TOWNS } from "@/lib/constants";
import type { ActionState, ClassRow, Exam, Lesson, Product } from "@/lib/types";
import { currentMonth, formatMonth, isoToColomboLocal, shiftMonth } from "@/lib/utils";
import * as A from "./actions";
import { useT } from "@/i18n/client";

function useForms() {
  const t = useT("admin.forms");
  const tc = useT("common");
  const months = tc.raw<string[]>("months");
  return { t, tc, fm: (m: string) => formatMonth(m, months) };
}

type Act = (p: ActionState, fd: FormData) => Promise<ActionState>;

export function DeleteButton({ action, id, label, confirm, size = "sm" }: {
  action: Act; id: string; label?: string; confirm?: string; size?: "sm" | "icon";
}) {
  const { t } = useForms();
  label ??= t("delete");
  return (
    <ActionForm action={action} confirm={confirm ?? t("deleteConfirm")}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" size={size} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={label}>
        <Trash2 />{size === "sm" ? label : null}
      </SubmitButton>
    </ActionForm>
  );
}

const monthOptions = () => {
  const cur = currentMonth();
  return Array.from({ length: 16 }, (_, i) => shiftMonth(cur, 3 - i));
};

// ───────────── Classes ─────────────
export function ClassForm({ cls }: { cls?: ClassRow }) {
  const { t, tc } = useForms();
  const [type, setType] = useState<string>(cls?.class_type ?? "Theory");
  const [free, setFree] = useState<boolean>(cls?.is_free ?? false);
  const isFree = free || type === "Free Seminar";
  return (
    <ActionForm action={A.saveClassAction} className="space-y-4">
      {cls && <input type="hidden" name="id" value={cls.id} />}
      <Field label={t("class.title")} htmlFor="title"><Input id="title" name="title" defaultValue={cls?.title} placeholder={t("class.titlePh")} required /></Field>
      <Field label={t("class.description")} htmlFor="description" hint={t("class.descriptionHint")}><Textarea id="description" name="description" defaultValue={cls?.description ?? ""} placeholder={t("class.descriptionPh")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("class.type")} htmlFor="class_type">
          <Select id="class_type" name="class_type" value={type} onChange={(e) => setType(e.target.value)}>{CLASS_TYPES.map((x) => <option key={x} value={x}>{tc(`classTypes.${x}`)}</option>)}</Select>
        </Field>
        <Field label={t("class.year")} htmlFor="target_year">
          <Select id="target_year" name="target_year" defaultValue={cls?.target_year ?? ""}><option value="">{t("allBatches")}</option>{AL_YEARS.map((y) => <option key={y}>{y}</option>)}</Select>
        </Field>
        <Field label={t("class.center")} htmlFor="town">
          <Select id="town" name="town" defaultValue={cls?.town ?? ""}><option value="">{t("class.anyCenter")}</option>{TOWNS.map((x) => <option key={x} value={x}>{tc(`towns.${x}`)}</option>)}</Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("class.fee")} htmlFor="fee" hint={isFree ? t("class.feeFree") : undefined}>
          <Input id="fee" name="fee" type="number" min={0} step={50} defaultValue={cls?.fee ?? 2500} disabled={isFree} />
        </Field>
        <Field label={t("class.schedule")} htmlFor="schedule"><Input id="schedule" name="schedule" defaultValue={cls?.schedule ?? ""} placeholder={t("class.schedulePh")} /></Field>
      </div>
      <Field label={t("class.banner")}>
        <FileUpload bucket="class-banners" prefix="banners" name="banner_url" publicUrl accept="image/jpeg,image/png,image/webp" maxMB={3} defaultValue={cls?.banner_url} label={t("class.bannerUpload")} />
      </Field>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={cls?.is_active ?? true} className="h-4 w-4 accent-[hsl(var(--primary))]" /> {t("class.active")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_free" checked={isFree} onChange={(e) => setFree(e.target.checked)} disabled={type === "Free Seminar"} className="h-4 w-4 accent-[hsl(var(--primary))]" /> {t("class.free")}</label>
      </div>
      <SubmitButton pendingText={tc("actions.saving")}>{cls ? t("class.save") : t("class.create")}</SubmitButton>
    </ActionForm>
  );
}

// ───────────── Lessons ─────────────
export function LessonForm({ classId, lesson, defaultMonth, onDone }: { classId: string; lesson?: Lesson; defaultMonth?: string; onDone?: () => void }) {
  const { t, tc, fm } = useForms();
  const [month, setMonth] = useState(lesson?.month ?? defaultMonth ?? currentMonth());
  return (
    <ActionForm action={A.saveLessonAction} className="space-y-4" resetOnSuccess={!lesson} onSuccess={onDone}>
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      <input type="hidden" name="class_id" value={classId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <Field label={t("month")} htmlFor={`month-${lesson?.id ?? "new"}`}>
          <Select id={`month-${lesson?.id ?? "new"}`} name="month" value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions().map((m) => <option key={m} value={m}>{fm(m)}</option>)}
          </Select>
        </Field>
        <Field label={t("lesson.week")} htmlFor={`week-${lesson?.id ?? "new"}`}>
          <Select id={`week-${lesson?.id ?? "new"}`} name="week_number" defaultValue={lesson?.week_number ?? 1}>{[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{t("lesson.weekN", { n: w })}</option>)}</Select>
        </Field>
      </div>
      <Field label={t("lesson.title")} htmlFor={`title-${lesson?.id ?? "new"}`}><Input id={`title-${lesson?.id ?? "new"}`} name="title" defaultValue={lesson?.title} placeholder={t("lesson.titlePh")} required /></Field>
      <Field label={t("lesson.notes")} htmlFor={`desc-${lesson?.id ?? "new"}`}><Textarea id={`desc-${lesson?.id ?? "new"}`} name="description" defaultValue={lesson?.description ?? ""} className="min-h-[60px]" /></Field>
      <Field label={t("lesson.youtube")} htmlFor={`yt-${lesson?.id ?? "new"}`} hint={t("lesson.youtubeHint")}>
        <Input id={`yt-${lesson?.id ?? "new"}`} name="youtube_url" type="url" defaultValue={lesson?.youtube_url ?? ""} placeholder="https://youtu.be/…" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("lesson.liveStart")} htmlFor={`ls-${lesson?.id ?? "new"}`}>
          <Input id={`ls-${lesson?.id ?? "new"}`} name="live_start_time" type="datetime-local" defaultValue={isoToColomboLocal(lesson?.live_start_time)} />
        </Field>
        <Field label={t("lesson.liveUrl")} htmlFor={`lu-${lesson?.id ?? "new"}`} hint={t("lesson.liveUrlHint")}>
          <Input id={`lu-${lesson?.id ?? "new"}`} name="live_url" type="url" defaultValue={lesson?.live_url ?? ""} placeholder="https://youtube.com/live/…" />
        </Field>
      </div>
      <Field label={t("lesson.tute")}>
        <FileUpload key={month} bucket="tute-pdfs" prefix={`${classId}/${month}`} name="tute_pdf_url" accept="application/pdf" maxMB={50}
          defaultValue={lesson?.month === month ? lesson?.tute_pdf_url : null} label={t("lesson.tuteUpload")} />
      </Field>
      <SubmitButton pendingText={tc("actions.saving")}>{lesson ? t("lesson.save") : t("lesson.add")}</SubmitButton>
    </ActionForm>
  );
}

// ───────────── Payments ─────────────
export function ReviewButtons({ id, action = A.reviewEnrollmentAction }: { id: string; action?: Act }) {
  const { t } = useForms();
  return (
    <ActionForm action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="id" value={id} />
      <Input name="admin_note" placeholder={t("review.note")} className="h-9 sm:w-56" />
      <div className="flex gap-2">
        <SubmitButton name="decision" value="approved" size="sm" variant="success"><Check /> {t("review.approve")}</SubmitButton>
        <SubmitButton name="decision" value="rejected" size="sm" variant="outline" className="text-destructive"><X /> {t("review.reject")}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function OrderButtons({ id, status }: { id: string; status: string }) {
  const { t } = useForms();
  return (
    <ActionForm action={A.reviewOrderAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="admin_note" placeholder={t("review.tracking")} className="h-9 w-48" />
      {status === "pending" && <SubmitButton name="decision" value="approved" size="sm" variant="success"><Check /> {t("review.approve")}</SubmitButton>}
      {status !== "shipped" && status !== "rejected" && <SubmitButton name="decision" value="shipped" size="sm" variant="outline"><Truck /> {t("review.shipped")}</SubmitButton>}
      {status === "pending" && <SubmitButton name="decision" value="rejected" size="sm" variant="outline" className="text-destructive"><X /> {t("review.reject")}</SubmitButton>}
    </ActionForm>
  );
}

export function GrantAccessForm({ classes }: { classes: Pick<ClassRow, "id" | "title">[] }) {
  const { t, fm } = useForms();
  return (
    <ActionForm action={A.grantAccessAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end" resetOnSuccess>
      <Field label={t("grant.student")} htmlFor="grant-student"><Input id="grant-student" name="student" placeholder={t("grant.studentPh")} required /></Field>
      <Field label={t("class.label")} htmlFor="grant-class"><Select id="grant-class" name="class_id" required>{classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
      <Field label={t("month")} htmlFor="grant-month"><Select id="grant-month" name="month" defaultValue={currentMonth()}>{monthOptions().map((m) => <option key={m} value={m}>{fm(m)}</option>)}</Select></Field>
      <SubmitButton>{t("grant.submit")}</SubmitButton>
    </ActionForm>
  );
}

// ───────────── Notices ─────────────
export function NoticeForm({ classes }: { classes: Pick<ClassRow, "id" | "title">[] }) {
  const { t, tc } = useForms();
  return (
    <ActionForm action={A.createNoticeAction} className="space-y-4" resetOnSuccess>
      <Field label={t("notice.title")} htmlFor="n-title"><Input id="n-title" name="title" required placeholder={t("notice.titlePh")} /></Field>
      <Field label={t("notice.message")} htmlFor="n-content"><Textarea id="n-content" name="content" required /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("notice.tag")} htmlFor="n-tag"><Select id="n-tag" name="tag">{NOTICE_TAGS.map((x) => <option key={x} value={x}>{tc(`noticeTags.${x}`)}</option>)}</Select></Field>
        <Field label={t("class.label")} htmlFor="n-class"><Select id="n-class" name="class_id"><option value="">{t("notice.allStudents")}</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
        <Field label={t("notice.batch")} htmlFor="n-year"><Select id="n-year" name="target_year"><option value="">{t("allBatches")}</option>{AL_YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_pinned" className="h-4 w-4" /> {t("notice.pin")}</label>
      <SubmitButton pendingText={t("notice.publishing")}><Send /> {t("notice.publish")}</SubmitButton>
    </ActionForm>
  );
}

export function NoticeRowActions({ id, pinned }: { id: string; pinned: boolean }) {
  const { t } = useForms();
  return (
    <div className="flex gap-1">
      <ActionForm action={A.updateNoticeAction}>
        <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={pinned ? "unpin" : "pin"} />
        <SubmitButton variant="ghost" size="icon" aria-label={pinned ? t("notice.unpinAria") : t("notice.pinAria")}>{pinned ? <PinOff /> : <Pin />}</SubmitButton>
      </ActionForm>
      <ActionForm action={A.updateNoticeAction} confirm={t("notice.deleteConfirm")}>
        <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="delete" />
        <SubmitButton variant="ghost" size="icon" className="text-destructive" aria-label={t("delete")}><Trash2 /></SubmitButton>
      </ActionForm>
    </div>
  );
}

// ───────────── Exams ─────────────
export function ExamForm({ exam, classes }: { exam?: Exam; classes: Pick<ClassRow, "id" | "title">[] }) {
  const { t, tc } = useForms();
  const [type, setType] = useState(exam?.exam_type ?? "mcq");
  const [classId, setClassId] = useState(exam?.class_id ?? classes[0]?.id ?? "");
  return (
    <ActionForm action={A.saveExamAction} className="space-y-4">
      {exam && <input type="hidden" name="id" value={exam.id} />}
      <Field label={t("exam.title")} htmlFor="e-title"><Input id="e-title" name="title" defaultValue={exam?.title} required placeholder={t("exam.titlePh")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("class.label")} htmlFor="e-class"><Select id="e-class" name="class_id" value={classId} onChange={(e) => setClassId(e.target.value)} required>{classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
        <Field label={t("exam.type")} htmlFor="e-type"><Select id="e-type" name="exam_type" value={type} onChange={(e) => setType(e.target.value as "mcq" | "structured")} disabled={!!exam}>
          <option value="mcq">{t("exam.mcq")}</option><option value="structured">{t("exam.structured")}</option></Select>
          {exam && <input type="hidden" name="exam_type" value={type} />}</Field>
        <Field label={t("exam.duration")} htmlFor="e-dur"><Input id="e-dur" name="duration_minutes" type="number" min={1} max={600} defaultValue={exam?.duration_minutes ?? 60} /></Field>
      </div>
      <Field label={t("exam.instructions")} htmlFor="e-desc"><Textarea id="e-desc" name="description" defaultValue={exam?.description ?? ""} className="min-h-[60px]" /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("exam.opens")} htmlFor="e-open"><Input id="e-open" name="opens_at" type="datetime-local" defaultValue={isoToColomboLocal(exam?.opens_at)} /></Field>
        <Field label={t("exam.closes")} htmlFor="e-close"><Input id="e-close" name="closes_at" type="datetime-local" defaultValue={isoToColomboLocal(exam?.closes_at)} /></Field>
      </div>
      {type === "structured" && classId && (
        <Field label={t("exam.paper")}>
          <FileUpload bucket="tute-pdfs" prefix={`${classId}/exams`} name="paper_pdf_url" accept="application/pdf" maxMB={50} defaultValue={exam?.paper_pdf_url} label={t("exam.paperUpload")} />
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={exam?.is_published ?? false} className="h-4 w-4" /> {t("exam.published")}</label>
      <SubmitButton pendingText={tc("actions.saving")}>{exam ? t("exam.save") : t("exam.create")}</SubmitButton>
    </ActionForm>
  );
}

export function QuestionForm({ examId }: { examId: string }) {
  const { t } = useForms();
  return (
    <ActionForm action={A.addQuestionAction} className="space-y-4" resetOnSuccess>
      <input type="hidden" name="exam_id" value={examId} />
      <Field label={t("question.text")} htmlFor="q-text"><Textarea id="q-text" name="question_text" required placeholder={t("question.textPh")} /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Field key={i} label={i > 2 ? t("question.optionalOption", { n: i }) : t("question.option", { n: i })} htmlFor={`q-o${i}`}><Input id={`q-o${i}`} name={`option_${i}`} required={i <= 2} /></Field>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("question.correct")} htmlFor="q-correct"><Select id="q-correct" name="correct_answer">{[1, 2, 3, 4, 5].map((i) => <option key={i} value={i}>{t("question.option", { n: i })}</option>)}</Select></Field>
          <Field label={t("question.marks")} htmlFor="q-marks"><Input id="q-marks" name="marks" type="number" min={0} step={0.5} defaultValue={1} /></Field>
        </div>
      </div>
      <Field label={t("question.explanation")} htmlFor="q-exp"><Textarea id="q-exp" name="explanation" className="min-h-[60px]" /></Field>
      <SubmitButton pendingText={t("question.adding")}>{t("question.add")}</SubmitButton>
    </ActionForm>
  );
}

export function GradeForm({ id, score, total, feedback }: { id: string; score: number | null; total: number | null; feedback: string | null }) {
  const { t, tc } = useForms();
  return (
    <ActionForm action={A.gradeSubmissionAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <Field label={t("question.marks")} htmlFor={`g-s-${id}`}><Input id={`g-s-${id}`} name="score" type="number" step={0.5} min={0} defaultValue={score ?? ""} className="h-9 w-20" required /></Field>
      <Field label={t("grade.outOf")} htmlFor={`g-t-${id}`}><Input id={`g-t-${id}`} name="total_marks" type="number" min={1} defaultValue={total ?? 100} className="h-9 w-20" /></Field>
      <Field label={t("grade.feedback")} htmlFor={`g-f-${id}`} className="min-w-40 flex-1"><Input id={`g-f-${id}`} name="feedback" defaultValue={feedback ?? ""} className="h-9" /></Field>
      <SubmitButton size="sm">{tc("actions.save")}</SubmitButton>
    </ActionForm>
  );
}

// ───────────── Students ─────────────
export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const { t } = useForms();
  return (
    <ActionForm action={A.resetPasswordAction} toasts={false} confirm={t("students.resetConfirm", { name })}
      onError={(s) => { toast.error(s?.error ?? ""); }}
      onSuccess={(s) => { toast.success(s?.message ?? "", { duration: 60_000, description: t("students.resetShare") }); }}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="outline" size="sm"><KeyRound /> {t("students.reset")}</SubmitButton>
    </ActionForm>
  );
}

export function RoleButton({ id, role }: { id: string; role: string }) {
  const { t } = useForms();
  const next = role === "admin" ? "student" : "admin";
  return (
    <ActionForm action={A.setRoleAction} confirm={next === "admin" ? t("students.makeAdminConfirm") : t("students.makeStudentConfirm")}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="role" value={next} />
      <SubmitButton variant="ghost" size="sm">{next === "admin" ? t("students.makeAdmin") : t("students.makeStudent")}</SubmitButton>
    </ActionForm>
  );
}

// ───────────── Store ─────────────
export function ProductForm({ product }: { product?: Product }) {
  const { t, tc } = useForms();
  return (
    <ActionForm action={A.saveProductAction} className="space-y-4" resetOnSuccess={!product}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
        <Field label={t("product.title")} htmlFor={`p-t-${product?.id ?? "new"}`}><Input id={`p-t-${product?.id ?? "new"}`} name="title" defaultValue={product?.title} required placeholder={t("product.titlePh")} /></Field>
        <Field label={t("product.price")} htmlFor={`p-p-${product?.id ?? "new"}`}><Input id={`p-p-${product?.id ?? "new"}`} name="price" type="number" min={0} defaultValue={product?.price ?? 1500} /></Field>
      </div>
      <Field label={t("class.description")} htmlFor={`p-d-${product?.id ?? "new"}`}><Textarea id={`p-d-${product?.id ?? "new"}`} name="description" defaultValue={product?.description ?? ""} className="min-h-[60px]" /></Field>
      <Field label={t("product.image")}>
        <FileUpload bucket="class-banners" prefix="products" name="image_url" publicUrl accept="image/jpeg,image/png,image/webp" maxMB={3} defaultValue={product?.image_url} label={t("product.imageUpload")} />
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="h-4 w-4" /> {t("product.active")}</label>
      <SubmitButton>{product ? tc("actions.save") : t("product.add")}</SubmitButton>
    </ActionForm>
  );
}
