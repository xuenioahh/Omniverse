import { motion } from "framer-motion";

const SCENARIO_IMAGES = {
  airport: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
  bank: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  shopping: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
  hospital: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80",
  university: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
  phone: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
  car_rental: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80",
  museum: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&q=80",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
};

export default function ScenarioCard({ scenario, onClick, index }) {
  const Icon = scenario.icon;
  const imgUrl = SCENARIO_IMAGES[scenario.id];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="glass glass-hover rounded-2xl flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden"
    >
      {/* Background image */}
      {imgUrl && (
        <div className="w-full aspect-[4/1.65] overflow-hidden rounded-t-2xl relative">
          <img
            src={imgUrl}
            alt={scenario.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          {/* Icon badge */}
          <div className={`absolute bottom-2 left-2 w-6.5 h-6.5 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      <div className="text-center px-2.5 py-3">
        <h3 className="font-semibold text-foreground text-[18px] leading-tight">{scenario.title}</h3>
        <p className="text-[14px] text-muted-foreground mt-1.5 leading-snug">{scenario.subtitle}</p>
      </div>
    </motion.button>
  );
}
