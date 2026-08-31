import { supabase, isSupabaseConfigured } from "../lib/supabase/client";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "../utils/storage";

function getOrCreateLocalUserId() {
  let id = localStorage.getItem("mcq_personal_user_id");
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem("mcq_personal_user_id", id);
  }
  return id;
}

export const storageService = {
  /**
   * Get or automatically initialize single-user / anonymous identity (no sign up required)
   */
  async getCurrentUser() {
    const localId = getOrCreateLocalUserId();

    if (!isSupabaseConfigured) {
      return { id: localId, email: "personal@local" };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        return sessionData.session.user;
      }

      // Try anonymous sign-in if enabled, otherwise use local identity
      const { data: anonData } = await supabase.auth.signInAnonymously();
      if (anonData?.user) {
        return anonData.user;
      }
    } catch (err) {
      // Fallback silently without showing login prompts
    }

    return { id: localId, email: "personal@local" };
  },

  /**
   * Complete & save quiz session with individual question attempts & wrong question records
   */
  async saveCompletedSession({ session, summary }) {
    const user = await this.getCurrentUser();
    const userId = user?.id || getOrCreateLocalUserId();

    // 1. Save to local storage for instant consistency
    const existingSessions = getStorageItem(STORAGE_KEYS.sessions, {});
    existingSessions[session.id] = session;
    setStorageItem(STORAGE_KEYS.sessions, existingSessions);

    // Save history entry
    const history = getStorageItem(STORAGE_KEYS.history, []);
    const historyEntry = {
      id: session.id,
      subjectId: session.subjectId,
      subjectTitle: session.subjectTitle,
      quizType: session.quizType || session.settings?.quizType || "topic_wise",
      total: session.questions.length,
      correct: summary.correct,
      wrong: summary.wrong,
      skipped: summary.unanswered,
      accuracy: summary.accuracy,
      score: summary.percentage,
      timeTaken: session.elapsedSeconds,
      dateLabel: new Date(session.submittedAt || Date.now()).toLocaleDateString(),
      completedAt: new Date(session.submittedAt || Date.now()).toISOString(),
    };
    const nextHistory = [historyEntry, ...history.filter((item) => item.id !== session.id)].slice(0, 50);
    setStorageItem(STORAGE_KEYS.history, nextHistory);

    // Track wrong questions in local storage map
    const localWrongMap = getStorageItem("mcq_wrong_questions_map", {});
    const nowIso = new Date().toISOString();

    session.questions.forEach((question, index) => {
      const selected = session.answers[index];
      const isCorrect = selected === question.answer;
      const isSkipped = selected === undefined || selected === null;
      const qId = question.globalId || question.id;

      if (!isSkipped && !isCorrect) {
        const existing = localWrongMap[qId] || {
          questionId: qId,
          question: question.question,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          subjectId: session.subjectId,
          subjectTitle: session.subjectTitle,
          topic: question.topic || session.subjectTitle,
          wrongCount: 0,
          correctCountAfterWrong: 0,
          firstWrongAt: nowIso,
          lastWrongAt: nowIso,
          isLearned: false,
          priority: "Medium",
          personalNote: "",
          lastSelectedAnswer: selected,
        };

        existing.wrongCount += 1;
        existing.lastWrongAt = nowIso;
        existing.lastSelectedAnswer = selected;
        existing.question = question.question;
        existing.options = question.options;
        existing.answer = question.answer;
        existing.explanation = question.explanation;

        // Intelligent priority calculation
        if (existing.wrongCount >= 3) {
          existing.priority = "Critical";
        } else if (existing.wrongCount === 2) {
          existing.priority = "High";
        } else {
          existing.priority = "Medium";
        }

        localWrongMap[qId] = existing;
      } else if (!isSkipped && isCorrect && localWrongMap[qId]) {
        localWrongMap[qId].correctCountAfterWrong += 1;
        if (localWrongMap[qId].correctCountAfterWrong >= 3) {
          localWrongMap[qId].priority = "Low";
        }
      }
    });

    setStorageItem("mcq_wrong_questions_map", localWrongMap);

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured && userId) {
      try {
        await supabase.from("quiz_sessions").upsert({
          id: session.id,
          user_id: userId,
          quiz_type: session.quizType || session.settings?.quizType || "topic_wise",
          quiz_title: session.subjectTitle,
          source_id: session.subjectId,
          mode: session.settings?.answerMode || "practice",
          started_at: new Date(session.startedAt).toISOString(),
          completed_at: new Date(session.submittedAt || Date.now()).toISOString(),
          total_questions: session.questions.length,
          attempted_questions: summary.attempted,
          correct_answers: summary.correct,
          wrong_answers: summary.wrong,
          skipped_questions: summary.unanswered,
          score: summary.percentage,
          accuracy: summary.accuracy,
          time_taken: session.elapsedSeconds,
        });

        const attemptsToInsert = session.questions.map((q, idx) => {
          const sel = session.answers[idx];
          return {
            user_id: userId,
            session_id: session.id,
            question_id: q.globalId || q.id,
            selected_answer: sel !== undefined && sel !== null ? sel : null,
            correct_answer: q.answer,
            is_correct: sel === q.answer,
            is_skipped: sel === undefined || sel === null,
            time_spent: 0,
            attempted_at: new Date().toISOString(),
          };
        });

        if (attemptsToInsert.length) {
          await supabase.from("question_attempts").insert(attemptsToInsert);
        }

        const wrongItems = Object.values(localWrongMap);
        for (const wrongItem of wrongItems) {
          await supabase.from("wrong_questions").upsert(
            {
              user_id: userId,
              question_id: wrongItem.questionId,
              wrong_count: wrongItem.wrongCount,
              correct_count_after_wrong: wrongItem.correctCountAfterWrong,
              last_wrong_at: wrongItem.lastWrongAt,
              is_learned: wrongItem.isLearned,
              priority: wrongItem.priority,
              personal_note: wrongItem.personalNote || "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id, question_id" }
          );
        }
      } catch (err) {
        // Silently handle offline/network mode
      }
    }

    return historyEntry;
  },

  /**
   * Save or update personal note for a question
   */
  async saveQuestionNote(questionId, note) {
    const notesMap = getStorageItem("mcq_question_notes_map", {});
    notesMap[questionId] = note;
    setStorageItem("mcq_question_notes_map", notesMap);

    const wrongMap = getStorageItem("mcq_wrong_questions_map", {});
    if (wrongMap[questionId]) {
      wrongMap[questionId].personalNote = note;
      setStorageItem("mcq_wrong_questions_map", wrongMap);
    }

    const user = await this.getCurrentUser();
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from("question_notes").upsert(
          {
            user_id: user.id,
            question_id: questionId,
            note,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, question_id" }
        );

        if (wrongMap[questionId]) {
          await supabase
            .from("wrong_questions")
            .update({ personal_note: note, updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("question_id", questionId);
        }
      } catch (err) {
        // Silently handle offline
      }
    }

    return note;
  },

  /**
   * Mark a wrong question as learned
   */
  async setQuestionLearned(questionId, isLearned) {
    const wrongMap = getStorageItem("mcq_wrong_questions_map", {});
    if (wrongMap[questionId]) {
      wrongMap[questionId].isLearned = isLearned;
      wrongMap[questionId].learnedAt = isLearned ? new Date().toISOString() : null;
      setStorageItem("mcq_wrong_questions_map", wrongMap);
    }

    const user = await this.getCurrentUser();
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from("wrong_questions")
          .update({
            is_learned: isLearned,
            learned_at: isLearned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      } catch (err) {
        // Silently handle offline
      }
    }

    return isLearned;
  },

  /**
   * Get all wrong questions list
   */
  async getWrongQuestions() {
    const user = await this.getCurrentUser();
    const localWrongMap = getStorageItem("mcq_wrong_questions_map", {});
    const localList = Object.values(localWrongMap);

    if (!isSupabaseConfigured || !user?.id) {
      return localList;
    }

    try {
      const { data, error } = await supabase
        .from("wrong_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_wrong_at", { ascending: false });

      if (error || !data || !data.length) return localList;

      return localList.map((localItem) => {
        const remote = data.find((r) => r.question_id === localItem.questionId);
        if (!remote) return localItem;
        return {
          ...localItem,
          wrongCount: remote.wrong_count || localItem.wrongCount,
          correctCountAfterWrong: remote.correct_count_after_wrong || localItem.correctCountAfterWrong,
          isLearned: remote.is_learned ?? localItem.isLearned,
          priority: remote.priority || localItem.priority,
          personalNote: remote.personal_note || localItem.personalNote,
          lastWrongAt: remote.last_wrong_at || localItem.lastWrongAt,
        };
      });
    } catch {
      return localList;
    }
  },

  /**
   * Get overall topic performance analytics
   */
  getTopicPerformance() {
    const sessions = getStorageItem(STORAGE_KEYS.sessions, {});
    const topicStats = {};

    Object.values(sessions).forEach((sess) => {
      if (!sess.submittedAt || !Array.isArray(sess.questions)) return;
      sess.questions.forEach((q, idx) => {
        const topic = q.topic || sess.subjectTitle || "General";
        if (!topicStats[topic]) {
          topicStats[topic] = { topic, attempted: 0, correct: 0, wrong: 0, accuracy: 0 };
        }

        const sel = sess.answers[idx];
        if (sel !== undefined && sel !== null) {
          topicStats[topic].attempted += 1;
          if (sel === q.answer) {
            topicStats[topic].correct += 1;
          } else {
            topicStats[topic].wrong += 1;
          }
        }
      });
    });

    Object.keys(topicStats).forEach((topic) => {
      const item = topicStats[topic];
      item.accuracy = item.attempted ? Math.round((item.correct / item.attempted) * 100) : 0;
    });

    const topicList = Object.values(topicStats);

    const weakTopics = [...topicList]
      .filter((t) => t.attempted >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const strongTopics = [...topicList]
      .filter((t) => t.attempted >= 2)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    return { topicList, weakTopics, strongTopics };
  },
};
