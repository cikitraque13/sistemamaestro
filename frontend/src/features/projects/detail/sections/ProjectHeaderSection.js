import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Globe,
  TextAlignLeft
} from '@phosphor-icons/react';

import { ROUTE_NAMES } from '../projectDetail.constants';

const ProjectHeaderSection = ({
  project,
  formattedDate
}) => {
  if (!project) return null;

  return (
    <>
      <Link
        to="/dashboard/projects"
        className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-white mb-6 transition-colors"
        data-testid="back-btn"
      >
        <ArrowLeft size={18} />
        Volver a proyectos
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
        data-testid="project-header"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#0F5257]/20 rounded-lg">
            {project.input_type === 'url' ? (
              <Globe size={24} className="text-[#0F5257]" />
            ) : (
              <TextAlignLeft size={24} className="text-[#0F5257]" />
            )}
          </div>

          <div className="flex-1">
            <span className="text-xs text-[#0F5257] font-medium uppercase tracking-wider">
              {project.input_type === 'url' ? 'Análisis de URL' : 'Descripción'}
            </span>
            <p className="text-white mt-1 break-words">{project.input_content}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[#A3A3A3]">
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {formattedDate}
          </span>

          <span className="px-3 py-1 bg-[#0F5257]/20 text-[#8DE1D0] rounded-full">
            {ROUTE_NAMES[project.route] || project.route || 'Sin clasificar'}
          </span>
        </div>
      </motion.div>
    </>
  );
};

export default ProjectHeaderSection;
