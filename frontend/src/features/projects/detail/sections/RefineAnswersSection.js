import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

const RefineAnswersSection = ({
  project,
  projectId
}) => {
  if (!project?.refine_questions || project.refine_questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card mb-6"
      data-testid="refine-section"
    >
      <h3 className="text-lg font-medium text-white mb-4">Preguntas de afinado</h3>

      <div className="space-y-4">
        {project.refine_questions.map((question, index) => (
          <div
            key={question.id || index}
            className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5"
          >
            <p className="text-[#A3A3A3] text-sm mb-2">{question.question}</p>

            {project.refine_answers?.[question.id] ? (
              <p className="text-white">{project.refine_answers[question.id]}</p>
            ) : (
              <p className="text-[#A3A3A3] italic">Sin responder</p>
            )}
          </div>
        ))}
      </div>

      {!project.refine_answers && (
        <Link
          to={`/flow?project=${projectId}&step=refine`}
          className="btn-primary inline-flex items-center gap-2 mt-4"
        >
          Responder preguntas
          <ArrowRight size={16} />
        </Link>
      )}
    </motion.div>
  );
};

export default RefineAnswersSection;
