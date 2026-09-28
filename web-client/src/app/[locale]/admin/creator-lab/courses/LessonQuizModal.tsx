"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, HelpCircle, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from '@/hooks/useTranslation';
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface LessonQuizModalProps {
  lesson: any;
  onClose: () => void;
}

export function LessonQuizModal({ lesson, onClose }: LessonQuizModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"quiz" | "assignment">("quiz");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Quiz State
  const [quiz, setQuiz] = useState<any>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: ""
  });

  // Assignment State
  const [assignment, setAssignment] = useState<any>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: ""
  });

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: "danger" | "warning" | "info" | "success"}>({ isOpen: false, title: "", message: "", type: "info" });
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [lesson.id]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchQuiz(), fetchAssignment()]);
    setLoading(false);
  };

  const fetchQuiz = async () => {
    try {
      const res = await apiClient.request(`/quizzes/lesson/${lesson.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      } else {
        setQuiz(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAssignment = async () => {
    try {
      const res = await apiClient.request(`/assignments/lesson/${lesson.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data);
      } else {
        setAssignment(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createQuiz = async () => {
    setActionLoading("createQuiz");
    try {
      const res = await apiClient.request("/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Quiz: ${lesson.title}`,
          lessonId: lesson.id
        })
      });
      if (res.ok) {
        await fetchQuiz();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("createAssignment");
    try {
      const res = await apiClient.request("/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentForm,
          lessonId: lesson.id
        })
      });
      if (res.ok) {
        await fetchAssignment();
        setIsAddingAssignment(false);
        setAlertInfo({ isOpen: true, title: "Thành công", message: "Đã tạo bài tập nộp file.", type: "success" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAssignment = async () => {
    if (!assignment) return;
    setActionLoading("deleteAssignment");
    try {
      const res = await apiClient.request(`/assignments/${assignment.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAssignment();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    setActionLoading("addQuestion");

    try {
      const res = await apiClient.request(`/quizzes/${quiz.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionForm)
      });
      if (res.ok) {
        await fetchQuiz();
        setIsAddingQuestion(false);
        setQuestionForm({ text: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" });
      } else {
        setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không thể thêm câu hỏi", type: "danger" });
      }
    } catch (error) {
      setAlertInfo({ isOpen: true, title: "Lỗi", message: "Không kết nối được server", type: "danger" });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestionId) return;
    setActionLoading(deleteQuestionId);
    try {
      const res = await apiClient.request(`/quizzes/questions/${deleteQuestionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchQuiz();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
      setDeleteQuestionId(null);
    }
  };

  const tStr = {
    modalTitle: language === 'vi' ? "Hoạt động Bài học:" : "Lesson Activities:",
    tabQuiz: language === 'vi' ? "Trắc nghiệm" : "Quiz",
    tabAssignment: language === 'vi' ? "Bài tập nộp file" : "Assignment",
    createQuiz: language === 'vi' ? "Tạo Quiz" : "Create Quiz",
    noQuiz: language === 'vi' ? "Bài học này chưa có trắc nghiệm." : "This lesson has no quiz yet.",
    questions: language === 'vi' ? "Danh sách câu hỏi" : "Questions List",
    addQ: language === 'vi' ? "Thêm câu hỏi" : "Add Question",
    noQ: language === 'vi' ? "Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!" : "No questions yet. Add the first one!",
    qText: language === 'vi' ? "Nội dung câu hỏi" : "Question Text",
    options: language === 'vi' ? "Các lựa chọn" : "Options",
    correct: language === 'vi' ? "Đáp án đúng" : "Correct Answer",
    explain: language === 'vi' ? "Giải thích (Tùy chọn)" : "Explanation (Optional)",
    cancel: language === 'vi' ? "Hủy" : "Cancel",
    save: language === 'vi' ? "Lưu" : "Save",
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{tStr.modalTitle}</h2>
              <p className="text-sm text-slate-500">{lesson.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "quiz" 
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tStr.tabQuiz}
          </button>
          <button
            onClick={() => setActiveTab("assignment")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "assignment" 
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tStr.tabAssignment}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {alertInfo.isOpen && (
            <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
              alertInfo.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' :
              alertInfo.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <AlertCircle size={20} className="mt-0.5" />
              <div>
                <h4 className="font-semibold">{alertInfo.title}</h4>
                <p className="text-sm opacity-90">{alertInfo.message}</p>
              </div>
              <button onClick={() => setAlertInfo({...alertInfo, isOpen: false})} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
          ) : activeTab === "quiz" ? (
            // ================== QUIZ TAB ==================
            !quiz ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-lg font-medium mb-2">{tStr.noQuiz}</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Tạo trắc nghiệm cho bài học này để giúp học viên ôn tập và kiểm tra kiến thức.</p>
                <button 
                  onClick={createQuiz}
                  disabled={actionLoading === 'createQuiz'}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                >
                  {actionLoading === 'createQuiz' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {tStr.createQuiz}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{tStr.questions} ({quiz.questions?.length || 0})</h3>
                  {!isAddingQuestion && (
                    <button 
                      onClick={() => setIsAddingQuestion(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      <Plus size={16} /> {tStr.addQ}
                    </button>
                  )}
                </div>

                {isAddingQuestion && (
                  <form onSubmit={handleAddQuestion} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{tStr.qText} *</label>
                      <textarea 
                        required
                        value={questionForm.text}
                        onChange={e => setQuestionForm({...questionForm, text: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {questionForm.options.map((opt, idx) => (
                        <div key={idx}>
                          <label className="flex items-center gap-2 text-sm font-medium mb-1">
                            <input 
                              type="radio" 
                              name="correctAnswer"
                              checked={questionForm.correctAnswer === idx}
                              onChange={() => setQuestionForm({...questionForm, correctAnswer: idx})}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            Lựa chọn {["A", "B", "C", "D"][idx]} {questionForm.correctAnswer === idx && <span className="text-xs text-green-600 bg-green-100 px-2 rounded-full">{tStr.correct}</span>}
                          </label>
                          <input 
                            required
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...questionForm.options];
                              newOpts[idx] = e.target.value;
                              setQuestionForm({...questionForm, options: newOpts});
                            }}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 ${questionForm.correctAnswer === idx ? 'border-green-400 dark:border-green-600 ring-1 ring-green-400' : 'border-slate-300 dark:border-slate-600'}`}
                            placeholder={`Nội dung lựa chọn ${["A", "B", "C", "D"][idx]}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">{tStr.explain}</label>
                      <textarea 
                        value={questionForm.explanation}
                        onChange={e => setQuestionForm({...questionForm, explanation: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                        placeholder="Giải thích vì sao đáp án này đúng..."
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        type="button"
                        onClick={() => setIsAddingQuestion(false)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition"
                      >
                        {tStr.cancel}
                      </button>
                      <button 
                        type="submit"
                        disabled={actionLoading === 'addQuestion'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        {actionLoading === 'addQuestion' ? <Loader2 size={16} className="animate-spin" /> : null}
                        {tStr.save}
                      </button>
                    </div>
                  </form>
                )}

                {/* List questions */}
                {quiz.questions?.length === 0 && !isAddingQuestion ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500">{tStr.noQ}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quiz.questions?.map((q: any, i: number) => (
                      <div key={q.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 relative group">
                        {deleteQuestionId === q.id ? (
                          <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 rounded-xl flex items-center justify-center gap-3 backdrop-blur-sm z-10">
                            <p className="font-medium text-slate-800 dark:text-white">Xóa câu hỏi này?</p>
                            <button onClick={() => setDeleteQuestionId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">Hủy</button>
                            <button onClick={confirmDeleteQuestion} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                              {actionLoading === q.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xóa
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteQuestionId(q.id)}
                            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        
                        <div className="flex gap-3 items-start pr-8">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">{q.content}</h4>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className={`px-3 py-2 rounded-lg border text-sm flex items-start gap-2 ${optIdx === q.correctOption ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                  <span className={`font-bold mt-0.5 flex-shrink-0 ${optIdx === q.correctOption ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>{["A", "B", "C", "D"][optIdx]}.</span>
                                  <span>{opt}</span>
                                  {optIdx === q.correctOption && <CheckCircle2 size={16} className="ml-auto text-green-500 mt-0.5 flex-shrink-0" />}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div className="mt-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                                <HelpCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <span><span className="font-semibold">Giải thích:</span> {q.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            // ================== ASSIGNMENT TAB ==================
            !assignment ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-medium mb-2">Chưa có bài tập nộp file</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Tạo một bài tập yêu cầu học viên tải file lên (PDF, Video, Word) hoặc nhập nội dung văn bản.</p>
                
                {!isAddingAssignment ? (
                  <button 
                    onClick={() => setIsAddingAssignment(true)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Tạo Bài tập
                  </button>
                ) : (
                  <form onSubmit={createAssignment} className="text-left bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 max-w-lg mx-auto">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tiêu đề bài tập *</label>
                      <Input 
                        required
                        value={assignmentForm.title}
                        onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                        placeholder="VD: Bài tập thực hành Video số 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mô tả / Yêu cầu</label>
                      <textarea 
                        value={assignmentForm.description}
                        onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Mô tả yêu cầu để học viên làm bài..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsAddingAssignment(false)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition"
                      >
                        {tStr.cancel}
                      </button>
                      <button 
                        type="submit"
                        disabled={actionLoading === 'createAssignment'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        {actionLoading === 'createAssignment' ? <Loader2 size={16} className="animate-spin" /> : null}
                        {tStr.save}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{assignment.title}</h3>
                    <button 
                      onClick={deleteAssignment}
                      className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition"
                      title="Xóa bài tập"
                    >
                      {actionLoading === 'deleteAssignment' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap">{assignment.description}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center">
                  <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Quản lý bài nộp</h4>
                  <p className="text-sm text-slate-500 mb-4">Tính năng xem và chấm điểm bài nộp của học viên sẽ được mở rộng trong Module Dashboard.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
