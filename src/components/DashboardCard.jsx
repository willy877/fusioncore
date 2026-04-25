import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardCard = ({ title, description, icon: Icon, link, color, index }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      onClick={handleCardClick}
      className="glass-effect rounded-xl p-6 cursor-pointer hover:glow-effect transition-all group"
    >
      <div className={`inline-flex p-4 rounded-lg bg-gradient-to-br ${color} mb-4`}>
        {Icon && <Icon className="w-8 h-8 text-white" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
        <span className="mr-2">Acceder</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
};

export default DashboardCard;