import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Lightning,
  Lock
} from '@phosphor-icons/react';

const BlueprintSection = ({
  project,
  userPlan,
  generatingBlueprint,
  onGenerateBlueprint
}) => {
  if (project?.blueprint) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="card"
        data-testid="blueprint-section"
      >
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <CheckCircle weight="fill" className="text-[#0F5257]" />
          Blueprint
        </h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-xl text-white mb-2">{project.blueprint.title}</h4>
            <p className="text-[#A3A3A3]">{project.blueprint.summary}</p>
          </div>

          {project.blueprint.priorities && (
            <div>
              <p className="text-sm text-[#A3A3A3] mb-2">Prioridades</p>
              <ul className="space-y-2">
                {project.blueprint.priorities.map((priority, index) => (
                  <li
                    key={`priority-${index}-${priority.substring(0, 20)}`}
                    className="flex items-start gap-2 text-white"
                  >
                    <span className="text-[#0F5257] font-medium">{index + 1}.</span>
                    {priority}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.blueprint.architecture && (
            <div>
              <p className="text-sm text-[#A3A3A3] mb-2">Arquitectura recomendada</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {project.blueprint.architecture.components && (
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-[#A3A3A3] mb-2">Componentes</p>
                    <ul className="space-y-1">
                      {project.blueprint.architecture.components.map((component) => (
                        <li
                          key={component}
                          className="text-white text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={14} className="text-[#0F5257]" />
                          {component}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.blueprint.architecture.tech_stack && (
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-[#A3A3A3] mb-2">Tech Stack</p>
                    <ul className="space-y-1">
                      {project.blueprint.architecture.tech_stack.map((tech) => (
                        <li
                          key={tech}
                          className="text-white text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={14} className="text-[#0F5257]" />
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {project.blueprint.monetization && (
            <div>
              <p className="text-sm text-[#A3A3A3] mb-2">Monetización</p>
              <p className="text-white">{project.blueprint.monetization}</p>
            </div>
          )}

          {project.blueprint.deployment_steps && (
            <div>
              <p className="text-sm text-[#A3A3A3] mb-2">Plan de despliegue</p>
              <ol className="space-y-2">
                {project.blueprint.deployment_steps.map((step, index) => (
                  <li
                    key={`deploy-${index}-${step.substring(0, 20)}`}
                    className="flex items-start gap-3 text-white"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0F5257]/20 text-[#0F5257] text-sm flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {project.blueprint.timeline_estimate && (
            <div className="p-4 bg-[#0F5257]/10 border border-[#0F5257]/30 rounded-lg">
              <p className="text-sm text-[#0F5257] mb-1">Tiempo estimado</p>
              <p className="text-white font-medium">{project.blueprint.timeline_estimate}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="card text-center py-8"
      data-testid="blueprint-locked"
    >
      <Lock size={48} className="text-[#A3A3A3] mx-auto mb-4" />
      <h3 className="text-lg text-white mb-2">Blueprint bloqueado</h3>

      <p className="text-[#A3A3A3] mb-6 max-w-md mx-auto">
        {userPlan === 'free'
          ? 'Actualiza al plan Blueprint o superior para desbloquear la estructura completa de tu proyecto.'
          : 'Genera el blueprint completo con prioridades, arquitectura y plan de despliegue.'}
      </p>

      {userPlan === 'free' ? (
        <Link
          to="/dashboard/billing"
          className="btn-primary inline-flex items-center gap-2"
        >
          Mejorar plan
          <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          onClick={onGenerateBlueprint}
          disabled={generatingBlueprint}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {generatingBlueprint ? (
            <>
              <div className="spinner w-4 h-4"></div>
              Generando...
            </>
          ) : (
            <>
              Generar Blueprint
              <Lightning size={16} />
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default BlueprintSection;
