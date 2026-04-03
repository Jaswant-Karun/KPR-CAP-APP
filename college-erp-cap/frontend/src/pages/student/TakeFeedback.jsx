import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { getStudentFeedbackContext, submitStudentFeedback } from "../../services/feedbackService";
import "./TakeFeedback.css";

const StarInput = ({ value, onChange }) => {
  const current = Number(value || 0);
  return (
    <div className="take-feedback-stars" role="group" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= current ? "active" : ""}
          onClick={() => onChange(n)}
        >
          <FaStar />
        </button>
      ))}
    </div>
  );
};

export default function TakeFeedback() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [context, setContext] = useState({
    cycle: null,
    questions: [],
    courses: [],
    alreadySubmitted: false,
    canSubmit: false,
  });

  const [answers, setAnswers] = useState({});

  const loadContext = async () => {
    try {
      setLoading(true);
      const response = await getStudentFeedbackContext(token);
      const nextContext = {
        cycle: response?.cycle || null,
        questions: response?.questions || [],
        courses: response?.courses || [],
        alreadySubmitted: Boolean(response?.alreadySubmitted),
        canSubmit: Boolean(response?.canSubmit),
      };
      setContext(nextContext);

      const nextAnswers = {};
      for (const course of nextContext.courses) {
        nextAnswers[course.courseId] = {};
        for (const question of nextContext.questions) {
          nextAnswers[course.courseId][question.id] = 0;
        }
      }
      setAnswers(nextAnswers);
      setMessage(response?.message || "");
      setMessageType("info");
    } catch (error) {
      setMessage(error?.message || "Failed to load feedback form");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadContext();
  }, [token]);

  const isComplete = useMemo(() => {
    if (!context.courses.length || !context.questions.length) return false;
    return context.courses.every((course) =>
      context.questions.every((q) => Number(answers?.[course.courseId]?.[q.id] || 0) >= 1)
    );
  }, [context, answers]);

  const setRating = (courseId, questionId, rating) => {
    setAnswers((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        [questionId]: rating,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      setMessage("Please provide star ratings for all questions in all registered courses");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const responses = context.courses.map((course) => ({
        courseId: course.courseId,
        answers: context.questions.map((question) => ({
          questionId: question.id,
          rating: Number(answers?.[course.courseId]?.[question.id] || 0),
        })),
      }));

      const submitResponse = await submitStudentFeedback({ responses }, token);
      setMessage(`Feedback submitted successfully. Ticket: ${submitResponse?.submission?.ticketNo || "-"}`);
      setMessageType("success");
      await loadContext();
    } catch (error) {
      setMessage(error?.message || "Failed to submit feedback");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="take-feedback-page">
      <div className="take-feedback-header">
        <h1>Take Feedback</h1>
        <p>Submit star ratings for your registered faculty courses</p>
      </div>

      {message && <div className={`take-feedback-msg ${messageType}`}>{message}</div>}

      {loading && <div className="take-feedback-card">Loading...</div>}

      {!loading && !context.cycle && (
        <div className="take-feedback-card">No active feedback created by admin</div>
      )}

      {!loading && context.cycle && context.alreadySubmitted && (
        <div className="take-feedback-card success">
          Feedback already submitted for {context.cycle.title} ({context.cycle.academicYear} Sem {context.cycle.semester})
        </div>
      )}

      {!loading && context.cycle && !context.alreadySubmitted && context.courses.length === 0 && (
        <div className="take-feedback-card">
          You do not have registered courses. Register courses first, then feedback will appear here.
        </div>
      )}

      {!loading && context.cycle && !context.alreadySubmitted && context.courses.length > 0 && (
        <div className="take-feedback-form-wrap">
          <div className="take-feedback-card">
            <h2>
              {context.cycle.title} - {context.cycle.academicYear} - Sem {context.cycle.semester}
            </h2>
            <p>All ratings are mandatory. Only faculty/admin can view percentages, not students.</p>
          </div>

          {context.courses.map((course) => (
            <div key={course.courseId} className="take-feedback-card">
              <h3>
                {course.code} - {course.name}
              </h3>
              <p>Faculty: {course.facultyName || "-"}</p>
              <div className="take-feedback-question-list">
                {context.questions.map((question) => (
                  <div key={`${course.courseId}-${question.id}`} className="take-feedback-question-item">
                    <div>
                      <strong>{question.order}. {question.text}</strong>
                    </div>
                    <StarInput
                      value={answers?.[course.courseId]?.[question.id] || 0}
                      onChange={(rating) => setRating(course.courseId, question.id, rating)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="button" className="submit-feedback-btn" onClick={handleSubmit}>
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
}
