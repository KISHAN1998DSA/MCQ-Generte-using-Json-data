import defaultSubjects from "../data/subjects";
import { extractQuestions, loadSubjectData } from "../utils/questionUtils";
import { getStableQuestionId } from "../utils/questionIdentity";

/**
 * Dynamic Content Registry for JSON Question Bank.
 * Automatically discovers, categorizes, and organizes questions into:
 * - Previous Year Papers
 * - Topic Wise
 * - Subject Wise
 * - Practice Sets
 * - Mock Tests
 * - Revision
 */
export const CATEGORY_TYPES = {
  PREVIOUS_YEAR_PAPER: "previous_year_paper",
  TOPIC_WISE: "topic_wise",
  SUBJECT_WISE: "subject_wise",
  PRACTICE_SETS: "practice_sets",
  MOCK_TESTS: "mock_tests",
  REVISION: "revision",
};

export const CATEGORY_META = [
  {
    type: CATEGORY_TYPES.PREVIOUS_YEAR_PAPER,
    title: "Previous Year Papers",
    description: "Official questions from past BPSC, STET, and competitive exams.",
    accent: "from-amber-500 to-orange-600",
    badge: "PYQ",
  },
  {
    type: CATEGORY_TYPES.TOPIC_WISE,
    title: "Topic Wise Practice",
    description: "Focused practice by specific topic modules (Digital Logic, DBMS, OS, etc.).",
    accent: "from-sky-500 to-blue-600",
    badge: "Topic",
  },
  {
    type: CATEGORY_TYPES.SUBJECT_WISE,
    title: "Subject Wise Practice",
    description: "Master full subject domains (Computer Science, General Studies, etc.).",
    accent: "from-emerald-500 to-teal-600",
    badge: "Subject",
  },
  {
    type: CATEGORY_TYPES.PRACTICE_SETS,
    title: "Practice Sets",
    description: "Curated problem sets designed for drill practice.",
    accent: "from-violet-500 to-purple-600",
    badge: "Set",
  },
  {
    type: CATEGORY_TYPES.MOCK_TESTS,
    title: "Mock Tests",
    description: "Full-length timed exam simulations.",
    accent: "from-rose-500 to-pink-600",
    badge: "Mock",
  },
  {
    type: CATEGORY_TYPES.REVISION,
    title: "Revision & Mistake Hub",
    description: "Revisit your wrong questions, bookmarked items, and personal notes.",
    accent: "from-indigo-500 to-cyan-600",
    badge: "Revision",
  },
];

class ContentRegistry {
  constructor() {
    this.registry = [...defaultSubjects];
    this.loadedCache = new Map();
  }

  /**
   * Return all registered question sets
   */
  getAllSets() {
    return this.registry;
  }

  /**
   * Fetch and parse a registered question set with global stable IDs
   */
  async getSetById(id) {
    const item = this.registry.find((s) => s.id === id);
    if (!item) throw new Error(`Question set '${id}' not found.`);

    if (this.loadedCache.has(id)) {
      return this.loadedCache.get(id);
    }

    const payload = await loadSubjectData(item.file);
    const rawQuestions = extractQuestions(payload);

    // Enrich questions with stable global identity & metadata
    const questions = rawQuestions.map((q, idx) => ({
      ...q,
      globalId: getStableQuestionId(q, item.id, q.topic || item.title, idx),
      subjectId: item.id,
      subjectTitle: item.title,
    }));

    const result = {
      ...item,
      payload,
      questions,
      type: payload?.type || item.type || (item.id.includes("STET") ? CATEGORY_TYPES.PREVIOUS_YEAR_PAPER : CATEGORY_TYPES.TOPIC_WISE),
      subject: payload?.subject || item.subject || "Computer Science",
      year: payload?.year || item.year || null,
      difficulty: payload?.difficulty || "medium",
    };

    this.loadedCache.set(id, result);
    return result;
  }

  /**
   * Fetch all question sets categorized dynamically
   */
  async getCategorizedContent() {
    const loadedSets = await Promise.all(
      this.registry.map(async (set) => {
        try {
          return await this.getSetById(set.id);
        } catch (err) {
          return {
            ...set,
            questions: [],
            loadError: err.message,
          };
        }
      })
    );

    const categories = {
      [CATEGORY_TYPES.PREVIOUS_YEAR_PAPER]: [],
      [CATEGORY_TYPES.TOPIC_WISE]: [],
      [CATEGORY_TYPES.SUBJECT_WISE]: [],
      [CATEGORY_TYPES.PRACTICE_SETS]: [],
      [CATEGORY_TYPES.MOCK_TESTS]: [],
      [CATEGORY_TYPES.REVISION]: [],
    };

    loadedSets.forEach((set) => {
      const type = set.type || CATEGORY_TYPES.TOPIC_WISE;
      if (categories[type]) {
        categories[type].push(set);
      } else {
        categories[CATEGORY_TYPES.TOPIC_WISE].push(set);
      }
    });

    return { loadedSets, categories };
  }
}

export const contentRegistry = new ContentRegistry();
